import { NextRequest, NextResponse } from "next/server";
import { ingestPriceSnapshot, parsePriceListCsv } from "@/app/api/price-updates/service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const captureDate = formData.get("captureDate");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "CSV file is required" }, { status: 400 });
    }

    const text = await file.text();
    const { rows, captureDate: parsedDate } = parsePriceListCsv(text, typeof captureDate === "string" ? captureDate : undefined);
    const result = await ingestPriceSnapshot(rows, parsedDate, file.name);

    return NextResponse.json({
      success: true,
      captureDate: result.captureDate,
      snapshotRows: result.snapshotRows,
      changeEvents: result.changeEvents,
    });
  } catch (error: any) {
    console.error("Price update upload failed", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process upload" },
      { status: 500 }
    );
  }
}
