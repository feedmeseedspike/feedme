import * as React from "react";
import { render } from "@react-email/render";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import PriceUpdateEmail, {
  PriceChangeItem,
  PriceUpdateEmailProps,
} from "@/utils/email/priceUpdateEmail";
import { sendMail } from "@/utils/email/mailer";

const DEFAULT_TOP_LIMIT = Number(process.env.PRICE_UPDATE_TOP_LIMIT || "10");

export type SendPriceUpdateOptions = {
  captureDate?: string;
  emails?: string[];
  subjectPrefix?: string;
  from?: string | null | undefined;
  topLimit?: number;
};

export type SendPriceUpdateResult = {
  captureDate: string;
  sent: number;
  subscribers: number;
  increases: number;
  decreases: number;
  newProducts: number;
  summary: PriceUpdateEmailProps["summary"];
  mode: "test" | "bulk";
};

export type IngestPriceSnapshotResult = {
  captureDate: string;
  snapshotRows: number;
  changeEvents: number;
};

type ParsedSnapshotRow = {
  product_name: string;
  unit: string | null;
  category: string | null;
  list_price: number;
  old_price?: number | null; // From CSV OLD PRICE column if available
  captured_at: string;
};

type SnapshotTableRow = {
  id: string;
  product_name: string;
  unit: string | null;
  category: string | null;
  list_price: number | string | null;
};

type SubscriberRecord = {
  email: string | null;
  full_name: string | null;
};

type PriceChangeEventInsert = {
  captured_at: string;
  product_name: string;
  unit: string | null;
  category: string | null;
  old_price: number | null;
  new_price: number;
  change_amount: number | null;
  change_ratio: number | null;
  snapshot_id: string | null;
  previous_snapshot_id: string | null;
  metadata: Record<string, unknown> | null;
  id: string;
  created_at?: string;
};

function normalizeWhitespace(str = "") {
  return str.replace(/\s+/g, " ").trim();
}

function parsePrice(raw = "") {
  const cleaned = raw.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === "\"") {
        if (line[i + 1] === "\"") {
          current += "\"";
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === ",") {
        result.push(current);
        current = "";
      } else if (ch === "\"") {
        inQuotes = true;
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result.map((value) => value.trim());
}

function findHeader(lines: string[]) {
  for (let i = 0; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]).map(normalizeWhitespace);
    if (cols.some((c) => /food item/i.test(c)) && cols.some((c) => /new price/i.test(c))) {
      return { index: i, columns: cols };
    }
  }
  return null;
}

export function parsePriceListCsv(
  content: string,
  captureDate?: string
): { rows: ParsedSnapshotRow[]; captureDate: string } {
  const defaultCapture = captureDate || new Date().toISOString().slice(0, 10);
  const rawLines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!rawLines.length) {
    throw new Error("Uploaded CSV is empty");
  }

  const header = findHeader(rawLines);
  if (!header) {
    throw new Error("Could not locate header row containing 'Food Item' and 'NEW PRICE'");
  }

  const idxCategory = header.columns.findIndex((c) => /categories?/i.test(c));
  const idxFood = header.columns.findIndex((c) => /food item/i.test(c));
  const idxQuantity = header.columns.findIndex((c) => /quantity/i.test(c));
  const idxWeight = header.columns.findIndex((c) => /weight/i.test(c));
  const idxNewPrice = header.columns.findIndex((c) => /new price/i.test(c));
  const idxOldPrice = header.columns.findIndex((c) => /old price/i.test(c));

  if (idxFood === -1 || idxNewPrice === -1) {
    throw new Error("Required columns missing: 'Food Item' or 'NEW PRICE'");
  }

  const dedupe = new Map<string, ParsedSnapshotRow>();
  let currentCategory = "";

  for (let i = header.index + 1; i < rawLines.length; i++) {
    const row = splitCsvLine(rawLines[i]).map(normalizeWhitespace);
    if (!row.length) continue;

    const categoryRaw = idxCategory !== -1 ? row[idxCategory] : "";
    if (categoryRaw) currentCategory = categoryRaw;

    const productName = row[idxFood] || "";
    if (!productName) continue;

    const unitParts = [
      idxQuantity !== -1 ? row[idxQuantity] : "",
      idxWeight !== -1 ? row[idxWeight] : "",
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const newPrice = parsePrice(idxNewPrice !== -1 ? row[idxNewPrice] : "");
    if (newPrice == null) continue;

    // Extract old price from CSV if available (for direct comparison)
    const oldPriceFromCsv = idxOldPrice !== -1 
      ? parsePrice(row[idxOldPrice]) 
      : null;

    const key = `${productName.toLowerCase()}|${unitParts.toLowerCase()}`;
    dedupe.set(key, {
      product_name: productName,
      unit: unitParts || null,
      category: currentCategory || null,
      list_price: newPrice,
      old_price: oldPriceFromCsv ?? undefined,
      captured_at: defaultCapture,
    });
  }

  const rows = Array.from(dedupe.values()).sort((a, b) =>
    a.product_name.localeCompare(b.product_name)
  );

  if (!rows.length) {
    throw new Error("No price rows detected in CSV");
  }

  return { rows, captureDate: defaultCapture };
}

export async function getLatestCaptureDate(): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("price_change_events")
    .select("captured_at")
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch latest capture date", error);
    throw error;
  }

  return data?.captured_at ?? null;
}

export async function fetchSnapshotCount(captureDate: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("excel_price_snapshots")
    .select("id", { count: "exact", head: true })
    .eq("captured_at", captureDate);

  if (error) {
    console.error("Failed to count snapshot rows", error);
    throw error;
  }

  return count ?? 0;
}

async function fetchChangeEvents(captureDate: string) {
  const { data, error } = await supabaseAdmin
    .from("price_change_events")
    .select(
      "product_name, unit, category, old_price, new_price, change_amount, change_ratio, metadata"
    )
    .eq("captured_at", captureDate);

  if (error) {
    console.error("Failed to load price change events", error);
    throw error;
  }

  return data ?? [];
}

async function fetchSubscribers(): Promise<SubscriberRecord[]> {
  const { data, error } = await supabaseAdmin
    .from("price_update_subscriptions")
    .select("email, full_name")
    .eq("is_active", true);

  if (error) {
    console.error("Failed to load subscribers", error);
    throw error;
  }

  return data ?? [];
}

async function fetchAllCustomerEmails(): Promise<SubscriberRecord[]> {
  const [{ data: users, error: usersError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      supabaseAdmin.from("users").select("id, email"),
      supabaseAdmin.from("profiles").select("user_id, display_name"),
    ]);

  if (usersError) {
    console.error("Failed to load users for fallback", usersError);
    throw usersError;
  }
  if (profilesError) {
    console.error("Failed to load profiles for fallback", profilesError);
    throw profilesError;
  }

  const nameById = new Map<string, string | null>();
  (profiles ?? []).forEach((profile) => {
    nameById.set(profile.user_id, profile.display_name ?? null);
  });

  return (users ?? [])
    .filter((user) => user.email)
    .map((user) => ({
      email: user.email,
      full_name: nameById.get(user.id ?? "") ?? null,
    }));
}

function normalizeEvents(rawEvents: any[]): PriceChangeItem[] {
  return rawEvents.map((event: any) => ({
    productName: event.product_name,
    unit: event.unit,
    category: event.category,
    oldPrice: event.old_price != null ? Number(event.old_price) : null,
    newPrice: Number(event.new_price),
    changeAmount: event.change_amount != null ? Number(event.change_amount) : null,
    changeRatio: event.change_ratio != null ? Number(event.change_ratio) : null,
  }));
}

function buildEmailPayload(
  captureDate: string,
  events: PriceChangeItem[],
  totalTracked: number,
  topLimit: number
): PriceUpdateEmailProps {
  // Filter to only products with actual changes:
  // 1. Products with price changes (changeAmount != null && changeAmount !== 0)
  // 2. New products (oldPrice == null, meaning they didn't exist in previous snapshot)
  const changedEvents = events.filter(
    (item) => 
      // Has a price change (increase or decrease)
      (item.changeAmount != null && item.changeAmount !== 0) ||
      // Or is a new product (didn't exist before)
      item.oldPrice == null
  );

  // Show all increases (price went up)
  const increases = changedEvents
    .filter((item) => item.changeAmount != null && item.changeAmount > 0)
    .sort((a, b) => (b.changeAmount ?? 0) - (a.changeAmount ?? 0));

  // Show all decreases (price went down)
  const decreases = changedEvents
    .filter((item) => item.changeAmount != null && item.changeAmount < 0)
    .sort((a, b) => (a.changeAmount ?? 0) - (b.changeAmount ?? 0));

  // Show new products (didn't exist in previous snapshot)
  const newProducts = changedEvents
    .filter((item) => item.oldPrice == null)
    .slice(0, topLimit); // Keep limit for new products only

  // Summary counts only products with actual changes
  const summary = {
    totalTracked: changedEvents.length, // Only count products with changes
    increaseCount: increases.length,
    decreaseCount: decreases.length,
    newCount: newProducts.length,
  };

  // Normalize website URL to always have a protocol
  let websiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://shopfeedme.com";
  websiteUrl = websiteUrl.trim();
  if (!websiteUrl.startsWith("http://") && !websiteUrl.startsWith("https://")) {
    websiteUrl = `https://${websiteUrl}`;
  }
  websiteUrl = websiteUrl.replace(/\/$/, ""); // Remove trailing slash

  return {
    captureDate,
    increases,
    decreases,
    newProducts,
    summary,
    websiteUrl,
  };
}

function keyForSnapshot(row: { product_name: string; unit: string | null }): string {
  return `${row.product_name.toLowerCase()}|${(row.unit || "").toLowerCase()}`;
}

async function loadSnapshotRows(captureDate: string): Promise<SnapshotTableRow[]> {
  const { data, error } = await supabaseAdmin
    .from("excel_price_snapshots")
    .select("id, product_name, unit, category, list_price")
    .eq("captured_at", captureDate);

  if (error) {
    console.error("Failed to load snapshot rows", error);
    throw error;
  }

  return data ?? [];
}

async function fetchPreviousSnapshotDate(captureDate: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("excel_price_snapshots")
    .select("captured_at")
    .lt("captured_at", captureDate)
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("Failed to fetch previous snapshot date", error);
    throw error;
  }

  return data?.captured_at ?? null;
}

async function syncPriceChangeEvents(
  captureDate: string,
  currentRows: SnapshotTableRow[],
  previousRows: SnapshotTableRow[],
  parsedRows?: ParsedSnapshotRow[] // Optional: parsed rows with old_price from CSV
) {
  // Create a map of CSV old_price if available (keyed by product+unit)
  // Only include entries where old_price is actually a number (not null/undefined)
  const csvOldPriceMap = new Map<string, number>();
  if (parsedRows) {
    parsedRows.forEach((row) => {
      if (row.old_price != null && Number.isFinite(row.old_price)) {
        const key = keyForSnapshot(row);
        csvOldPriceMap.set(key, row.old_price);
      }
    });
  }

  const currentMap = new Map<string, SnapshotTableRow>();
  currentRows.forEach((row) => currentMap.set(keyForSnapshot(row), row));

  const previousMap = new Map<string, SnapshotTableRow>();
  previousRows.forEach((row) => previousMap.set(keyForSnapshot(row), row));

  const events: PriceChangeEventInsert[] = [];

  // Helper function to normalize price for comparison
  const normalizePrice = (price: number | string | null): number | null => {
    if (price == null) return null;
    const num = typeof price === "string" 
      ? Number(String(price).replace(/,/g, ""))
      : price;
    return Number.isFinite(num) ? Number(num.toFixed(2)) : null;
  };

  // Check products in current snapshot
  for (const [key, current] of currentMap.entries()) {
    const previous = previousMap.get(key);
    
    // Normalize prices for comparison
    const newPriceNormalized = normalizePrice(current.list_price);
    const previousPriceNormalized = previous ? normalizePrice(previous.list_price) : null;
    
    // Priority: Use old_price from CSV if available, otherwise use previous snapshot
    let oldPrice: number | null = null;
    
    if (csvOldPriceMap.has(key)) {
      // CSV has OLD PRICE column with a valid value - use it directly
      oldPrice = csvOldPriceMap.get(key)!;
    } else if (previousPriceNormalized != null) {
      // Fall back to previous snapshot comparison (CSV doesn't have old_price for this product)
      oldPrice = previousPriceNormalized;
    }
    // If no CSV old_price and no previous snapshot, oldPrice remains null (new product)
    
    const newPrice = newPriceNormalized ?? 0;

    // Skip if price hasn't changed (only create events for actual changes)
    // Compare normalized prices to avoid floating point precision issues
    if (oldPrice != null && Math.abs(oldPrice - newPrice) < 0.01) {
      // Prices are effectively the same (within 0.01 tolerance for floating point)
      continue;
    }

    // Only create events for:
    // 1. Products with price changes (oldPrice != null and different from newPrice)
    // 2. Products that are truly new (oldPrice == null and no previous snapshot)
    const changeAmount = oldPrice != null ? Number((newPrice - oldPrice).toFixed(2)) : null;
    const changeRatio = oldPrice && oldPrice !== 0 ? Number(((newPrice - oldPrice) / oldPrice).toFixed(6)) : null;

    // Determine if this is a new product
    const isNewProduct = oldPrice == null && !previous;

    events.push({
      captured_at: captureDate,
      product_name: current.product_name,
      unit: current.unit,
      category: current.category,
      old_price: oldPrice,
      new_price: newPrice,
      change_amount: changeAmount,
      change_ratio: changeRatio,
      snapshot_id: current.id,
      previous_snapshot_id: previous ? previous.id : null,
      metadata: isNewProduct ? { status: "new_product" } : null,
      id: randomUUID(),
      created_at: new Date().toISOString(),
    });
  }

  // Note: We don't track products that were removed (existed in previous but not in current)
  // If needed, we can add that logic here later

  await supabaseAdmin
    .from("price_change_events")
    .delete()
    .eq("captured_at", captureDate);

  if (events.length) {
    const chunkSize = 500;
    for (let i = 0; i < events.length; i += chunkSize) {
      const chunk = events.slice(i, i + chunkSize);
      const { error } = await supabaseAdmin.from("price_change_events").insert(chunk as any);
      if (error) {
        console.error("Failed to insert price change events", error);
        throw error;
      }
    }
  }

  return events.length;
}

export async function ingestPriceSnapshot(
  rows: ParsedSnapshotRow[],
  captureDateOverride?: string,
  sourceFile?: string
): Promise<IngestPriceSnapshotResult> {
  if (!rows.length) {
    throw new Error("No snapshot rows provided");
  }

  const captureDate = captureDateOverride ?? rows[0].captured_at;

  const payload = rows.map((row) => ({
    captured_at: captureDate,
    product_name: row.product_name,
    unit: row.unit,
    category: row.category,
    list_price: row.list_price,
    source_file: sourceFile ?? null,
  }));

  // Load existing snapshot BEFORE upsert to compare against it
  // This prevents duplicate events when uploading the same CSV multiple times
  const existingRowsBeforeUpsert = await loadSnapshotRows(captureDate);
  
  const { error: upsertError } = await supabaseAdmin
    .from("excel_price_snapshots")
    .upsert(payload, { onConflict: "captured_at,product_name,unit" });

  if (upsertError) {
    console.error("Failed to upsert price snapshots", upsertError);
    throw upsertError;
  }

  // Load current rows after upsert
  const currentRows = await loadSnapshotRows(captureDate);
  
  // Determine which snapshot to compare against:
  // 1. If there's already a snapshot for this date, compare against it (prevents duplicates on re-upload)
  // 2. Otherwise, compare against the previous date's snapshot
  const previousDate = await fetchPreviousSnapshotDate(captureDate);
  const previousRows = previousDate ? await loadSnapshotRows(previousDate) : [];
  
  // Use existing snapshot from same date if it exists, otherwise use previous date's snapshot
  const comparisonRows = existingRowsBeforeUpsert.length > 0
    ? existingRowsBeforeUpsert  // Compare against existing snapshot from same date
    : previousRows; // Otherwise compare against previous date's snapshot
  
  // Pass parsed rows so we can use CSV old_price if available
  const changeCount = await syncPriceChangeEvents(captureDate, currentRows, comparisonRows, rows);

  return {
    captureDate,
    snapshotRows: currentRows.length,
    changeEvents: changeCount,
  };
}

export async function sendPriceUpdateEmails(
  options: SendPriceUpdateOptions = {}
): Promise<SendPriceUpdateResult> {
  const topLimit = options.topLimit ?? DEFAULT_TOP_LIMIT;
  const subjectPrefix =
    options.subjectPrefix ??
    process.env.PRICE_UPDATE_SUBJECT_PREFIX ??
    "FeedMe Price Update";
  const fromAddress =
    (options.from ?? process.env.PRICE_UPDATE_FROM ?? process.env.SMTP_FROM) ??
    process.env.NODEMAILER_USER ?? undefined;

  const captureDate = options.captureDate ?? (await getLatestCaptureDate());

  if (!captureDate) {
    throw new Error("No price snapshots available");
  }

  const validEmails = options.emails?.filter((email) => typeof email === "string" && email.includes("@")) ?? [];

  const [rawEvents, recipientRecords, totalTracked] = await Promise.all([
    fetchChangeEvents(captureDate),
    validEmails.length
      ? Promise.resolve(validEmails.map((email) => ({ email, full_name: null })))
      : fetchSubscribers().then(async (subs) => {
          if (subs.length) return subs;
          return fetchAllCustomerEmails();
        }),
    fetchSnapshotCount(captureDate),
  ]);

  console.log(`[PriceUpdateService] Found ${rawEvents.length} events and ${recipientRecords.length} recipients for ${captureDate}`);

  const subscribers = recipientRecords.filter((record) => record.email);

  if (!subscribers.length) {
    throw new Error("No subscriber emails available");
  }

  const events = normalizeEvents(rawEvents);

  if (!events.length) {
    throw new Error("No change events to send");
  }

  const emailPayload = buildEmailPayload(captureDate, events, totalTracked, topLimit);
  const subject = `${subjectPrefix} – ${captureDate}`;

  console.log(`[PriceUpdateService] Starting send loop for ${subscribers.length} subscribers`);
  let sent = 0;
  for (const subscriber of subscribers) {
    if (!subscriber.email) continue;
    
    // Generate unique tracking ID for each recipient
    const trackingId = randomUUID();
    
    // Add tracking info to email payload
    const emailWithTracking = {
      ...emailPayload,
      trackingId,
      recipientEmail: subscriber.email,
    };
    
    // Render email per recipient (for personalized tracking)
    const emailElement = React.createElement(PriceUpdateEmail, emailWithTracking);
    console.log(`[PriceUpdateService] Rendering email for ${subscriber.email}...`);
    const html = await render(emailElement, { pretty: true });
    console.log(`[PriceUpdateService] Rendered HTML length: ${html.length}`);
    
    try {
      console.log(`[PriceUpdateService] Sending mail to ${subscriber.email} via SMTP...`);
      await sendMail({
        to: subscriber.email,
        subject,
        html,
        from: fromAddress,
      });
      console.log(`[PriceUpdateService] Successfully sent mail to ${subscriber.email}`);
      
      // Log "sent" event for tracking
      try {
        await supabaseAdmin.from("email_tracking_events").insert({
          tracking_id: trackingId,
          email: subscriber.email,
          event_type: "sent",
          capture_date: captureDate, // Added this field
          captured_at: new Date().toISOString(),
        });
      } catch (trackError) {
        // Don't fail email send if tracking fails
        console.error("Failed to log sent event", trackError);
      }
      
      sent += 1;
    } catch (mailError) {
      console.error(`Failed to send email to ${subscriber.email}`, mailError);
      // Continue with other emails even if one fails
    }
  }

  return {
    captureDate,
    sent,
    subscribers: subscribers.length,
    increases: emailPayload.increases.length,
    decreases: emailPayload.decreases.length,
    newProducts: emailPayload.newProducts.length,
    summary: emailPayload.summary,
    mode: validEmails.length ? "test" : "bulk",
  };
}