import { NextRequest, NextResponse } from "next/server";
import { sendPriceUpdateEmails } from "@/app/api/price-updates/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const captureDate = typeof body.captureDate === "string" ? body.captureDate : undefined;
    const emails = Array.isArray(body.emails)
      ? body.emails.filter((value: unknown): value is string => typeof value === "string" && value.includes("@"))
      : []; // allow empty for bulk send

    const result = await sendPriceUpdateEmails({
      captureDate,
      emails: emails.length ? emails : undefined,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Admin price update send failed", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to send price updates" },
      { status: 500 }
    );
  }
}
