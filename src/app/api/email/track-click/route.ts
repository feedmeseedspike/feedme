import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");
  const trackingId = searchParams.get("tracking_id");
  const email = searchParams.get("email");

  // If no URL provided, redirect to home
  const redirectUrl = url || "/";

  // Log click event if tracking info provided
  if (trackingId && email) {
    try {
      await supabaseAdmin.from("email_tracking_events").insert({
        tracking_id: trackingId,
        email: email,
        event_type: "click",
        captured_at: new Date().toISOString(),
        metadata: { url: redirectUrl },
      });
    } catch (error) {
      console.error("Failed to log email click event", error);
      // Don't fail the redirect
    }
  }

  // Redirect to the actual URL
  return NextResponse.redirect(redirectUrl, 302);
}

