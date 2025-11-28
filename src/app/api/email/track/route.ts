import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type"); // "open" or "click"
  const trackingId = searchParams.get("tracking_id");
  const email = searchParams.get("email");

  if (!type || !trackingId || !email) {
    // Return a 1x1 transparent pixel even if tracking fails
    return new NextResponse(
      Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      ),
      {
        status: 200,
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  }

  try {
    // Log the tracking event
    await supabaseAdmin.from("email_tracking_events").insert({
      tracking_id: trackingId,
      email: email,
      event_type: type,
      captured_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to log email tracking event", error);
    // Don't fail the request - still return the pixel
  }

  // Return a 1x1 transparent GIF pixel
  return new NextResponse(
    Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    ),
    {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    }
  );
}

