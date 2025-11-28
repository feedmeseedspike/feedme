import { NextRequest, NextResponse } from "next/server";
import { sendPriceUpdateEmails } from "@/app/api/price-updates/service";

const API_TOKEN = process.env.PRICE_UPDATE_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (API_TOKEN) {
      const authHeader = req.headers.get("authorization");
      const providedToken = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader ?? undefined;

      if (providedToken !== API_TOKEN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const captureDate = typeof body.captureDate === "string" ? body.captureDate : undefined;

    const emailsInput = Array.isArray(body.emails) ? (body.emails as unknown[]) : [];
    const testEmails = emailsInput.filter((value): value is string => typeof value === "string" && value.includes("@"));
    if (!testEmails.length && typeof body.testEmail === "string" && body.testEmail.includes("@")) {
      testEmails.push(body.testEmail);
    }

    const result = await sendPriceUpdateEmails({
      captureDate,
      emails: testEmails.length ? testEmails : undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Failed to send price update email", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
