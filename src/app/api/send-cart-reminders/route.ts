import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // Ensures no build-time execution

const CRON_SECRET = process.env.CRON_SECRET || "default-secret-change-me";

async function runCartReminderJob(supabaseAdmin: any, resend: any) {
  // Fetch eligible carts (last activity within 90 days)
  const { data: carts, error: fetchError } = await supabaseAdmin
    .from("cart")
    .select(
      `
        id,
        user_id,
        updated_at,
        cart_reminder_history (
          reminder_number,
          sent_at
        )
      `,
    )
    .gt(
      "updated_at",
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    )
    .order("updated_at", { ascending: false });

  if (fetchError) throw fetchError;
  if (!carts?.length) {
    return {
      message: "No carts eligible for reminders",
      sent: 0,
      total_candidates: 0,
    };
  }

  let sentCount = 0;

  for (const cart of carts) {
    const history = cart.cart_reminder_history || [];
    const lastStage =
      history.length > 0
        ? Math.max(...history.map((h: any) => h.reminder_number))
        : 0;

    const lastSentDate = history.find(
      (h: any) => h.reminder_number === lastStage,
    )?.sent_at;

    let nextStage = lastStage + 1;
    let shouldSend = false;

    // Timing logic
    if (nextStage === 1) {
      shouldSend =
        new Date(cart.updated_at) <= new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour
    } else if (nextStage === 2) {
      shouldSend =
        !!lastSentDate &&
        new Date(lastSentDate) <=
          new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days after last send
    } else if (nextStage === 3) {
      shouldSend =
        !!lastSentDate &&
        new Date(lastSentDate) <=
          new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day after last send (or adjust)
    }

    if (nextStage > 3 || !shouldSend) continue;

    // Get user email
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(cart.user_id);

    if (userError || !userData?.user?.email) {
      console.warn(`No email for user ${cart.user_id}`);
      continue;
    }

    const email = userData.user.email;
    const firstName = userData.user.user_metadata?.first_name || "Customer";

    console.log(`[REMINDER #${nextStage}] → ${email} (cart ${cart.id})`);

    const templates = {
      1: {
        subject: "Oops! Your kitchen essentials are waiting 🥑🍋",
        preview:
          "Your cart is saved – complete your purchase in the next 24 hours for free Apple!",
        ctaText: "COMPLETE MY ORDER",
        ctaUrl: "https://shopfeedme.com/cart",
        body: `
            <p>Hi ${firstName},</p>
            <p>We noticed you left some delicious items in your cart! We've saved them for you.</p>
            <p><strong>Special Early-Bird Bonus:</strong> Complete your purchase within 24 hours and we'll include a <strong>free apple</strong> to keep the doctor away!</p>
            <p>[Dynamic cart items with images – add here if you fetch cart contents]</p>
            <p><a href="https://shopfeedme.com/cart" style="display:inline-block; padding:12px 24px; background:#000; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">
              COMPLETE MY ORDER
            </a></p>
            <p>Need help? Questions about products or shipping? Please call or Whatsapp chat <strong>0808 828 2487</strong> – we're here to help!</p>
            <p>The FeedMe Team.</p>
            <p><em>PS: All our ingredients are sourced fresh daily and shipped with care to preserve their natural goodness!</em></p>
          `,
      },
      2: {
        subject:
          "Still thinking about it? Your fresh picks won't wait forever 🌿",
        preview: "Limited stock but we've got a special offer just for you",
        ctaText: "CLAIM MY 10% OFF",
        ctaUrl: "https://shopfeedme.com/cart?promo=FRESH10",
        body: `
            <p>Hi ${firstName},</p>
            <p>Did you know? We carefully source and rotate our inventory to ensure maximum freshness, which means some items in your cart could sell out soon.</p>
            <p>To help you decide, here's a special offer:</p>
            <p><strong>Use code FRESH10 at checkout for 5% off your entire order!</strong></p>
            <p>[Dynamic cart items with images]</p>
            <p><a href="https://shopfeedme.com/cart?promo=FRESH10" style="display:inline-block; padding:12px 24px; background:#000; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">
             CLAIM MY 10% OFF
            </a></p>
            <p>Why customers love FeedMe:</p>
            <ul>
              <li>✓ 100% organic, sustainably sourced ingredients</li>
              <li>✓ 3hrs shipping on fresh items</li>
              <li>✓ Clean packaging</li>
            </ul>
            <p>Freshly yours,<br>The FeedMe Team.</p>
            <p><em>P.S. This offer expires in 24 hours. Stock is updated daily – secure your items before they're gone!</em></p>
          `,
      },
      3: {
        subject: "Your cart expires today! 🕛",
        preview: "We've saved one last offer for you",
        ctaText: "COMPLETE PURCHASE NOW - Free Delivery",
        ctaUrl: "https://shopfeedme.com/cart",
        body: `
            <p>Hi ${firstName},</p>
            <p>This is our final reminder about the items waiting in your cart. We'll need to clear saved carts tomorrow to make room for new inventory.</p>
            <p><strong>Get free shipping on orders over ₦100,000.</strong></p>
            <p>We'd hate for you to miss out on these kitchen essentials. This offer expires at midnight tonight.</p>
            <p>[Dynamic cart items with images]</p>
            <p><a href="https://shopfeedme.com/cart" style="display:inline-block; padding:12px 24px; background:#000; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold;">
          COMPLETE PURCHASE NOW - Free Delivery
            </a></p>
            <p>Yours Freshly,<br>The FeedMe Team.</p>
          `,
      },
    };

    const template = templates[nextStage as keyof typeof templates];
    if (!template) continue;

    const { error: emailError } = await resend.emails.send({
      from: "FeedMe Orders <orders@shopfeedme.com>",
      to: email,
      subject: template.subject,
      html: `<!DOCTYPE html><html><body>${template.body}</body></html>`,
    });

    if (emailError) {
      console.error("Email send failed:", emailError);
      continue;
    }

    // Record the send
    const { error: insertError } = await supabaseAdmin
      .from("cart_reminder_history")
      .insert({
        cart_id: cart.id,
        reminder_number: nextStage,
        sent_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Failed to save reminder history:", insertError);
    } else {
      sentCount++;
      console.log(
        `[SUCCESS] Reminder #${nextStage} sent & recorded for cart ${cart.id}`,
      );
    }
  }

  return { success: true, sent: sentCount, total_candidates: carts.length };
}

function extractProvidedSecret(request: Request) {
  const authHeader = request.headers.get("authorization");
  let headerSecret: string | null = null;
  if (authHeader && authHeader.startsWith("Bearer "))
    headerSecret = authHeader.split(" ")[1];

  let querySecret: string | null = null;
  try {
    const url = new URL(request.url);
    querySecret = url.searchParams.get("secret");
  } catch (e) {
    // ignore
  }

  return headerSecret || querySecret;
}

async function handleRequest(request: Request) {
  const provided = extractProvidedSecret(request);
  if (provided !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Lazy init clients
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey =
    process.env.SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase env vars");
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const resend = new Resend(resendApiKey || "");
  if (!resendApiKey) console.warn("RESEND_API_KEY missing – emails won't send");

  let runId: string | number | null = null;
  try {
    // Record run start in DB (optional table `cron_runs`)
    try {
      const { data: runData, error: runErr } = await supabaseAdmin
        .from("cron_runs")
        .insert({
          started_at: new Date().toISOString(),
          trigger: request.headers.get("user-agent") || "unknown",
          status: "started",
        })
        .select("id");

      if (runErr) console.warn("Failed to log cron run start:", runErr);
      runId = runData?.[0]?.id ?? null;
    } catch (e) {
      console.warn("cron_runs insert failed:", e);
    }

    const result = await runCartReminderJob(supabaseAdmin, resend);

    // update run result
    try {
      if (runId) {
        await supabaseAdmin
          .from("cron_runs")
          .update({
            finished_at: new Date().toISOString(),
            status: "success",
            sent_count: (result as any).sent ?? 0,
            total_candidates: (result as any).total_candidates ?? 0,
          })
          .eq("id", runId);
      }
    } catch (e) {
      console.warn("Failed to update cron_runs after success:", e);
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Cart reminder job failed:", err);
    // update run as failed
    try {
      if (typeof runId !== "undefined" && runId) {
        await supabaseAdmin
          .from("cron_runs")
          .update({
            finished_at: new Date().toISOString(),
            status: "error",
            error_message: err?.message ?? String(err),
          })
          .eq("id", runId);
      }
    } catch (e) {
      console.warn("Failed to update cron_runs after error:", e);
    }

    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return handleRequest(request);
}

export async function GET(request: Request) {
  // Support Vercel cron which triggers a GET without custom headers — use ?secret=
  return handleRequest(request);
}
