import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const captureDate = searchParams.get("captureDate");
    const limit = parseInt(searchParams.get("limit") || "100");

    let query = supabaseAdmin
      .from("email_tracking_events")
      .select("*")
      .order("captured_at", { ascending: false })
      .limit(limit);

    if (captureDate) {
      // Filter by date range (captureDate is the date, we want events from that day)
      const startDate = new Date(captureDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(captureDate);
      endDate.setHours(23, 59, 59, 999);

      query = query
        .gte("captured_at", startDate.toISOString())
        .lte("captured_at", endDate.toISOString());
    }

    const { data: events, error } = await query;

    if (error) {
      console.error("Failed to fetch tracking events", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Count unique tracking IDs (each email sent gets a unique tracking_id)
    // This gives us an estimate of emails sent (may miss emails never opened/clicked)
    const allTrackingIds = new Set(
      events?.map((e) => e.tracking_id).filter(Boolean) || []
    );
    const sentCount = allTrackingIds.size;

    // Calculate metrics
    const opens = events?.filter((e) => e.event_type === "open") || [];
    const clicks = events?.filter((e) => e.event_type === "click") || [];

    const uniqueOpens = new Set(opens.map((e) => e.tracking_id)).size;
    const uniqueClicks = new Set(clicks.map((e) => e.tracking_id)).size;

    const openRate = sentCount > 0 ? (uniqueOpens / sentCount) * 100 : 0;
    const clickRate = sentCount > 0 ? (uniqueClicks / sentCount) * 100 : 0;

    // Group by email to see individual user activity
    const userActivity = new Map<string, { email: string; opens: number; clicks: number; lastActivity: string }>();
    
    events?.forEach((event) => {
      const existing = userActivity.get(event.email) || {
        email: event.email,
        opens: 0,
        clicks: 0,
        lastActivity: event.captured_at,
      };

      if (event.event_type === "open") existing.opens++;
      if (event.event_type === "click") existing.clicks++;

      if (new Date(event.captured_at) > new Date(existing.lastActivity)) {
        existing.lastActivity = event.captured_at;
      }

      userActivity.set(event.email, existing);
    });

    return NextResponse.json({
      success: true,
      metrics: {
        sent: sentCount,
        opens: uniqueOpens,
        clicks: uniqueClicks,
        openRate: Math.round(openRate * 10) / 10,
        clickRate: Math.round(clickRate * 10) / 10,
      },
      events: events || [],
      userActivity: Array.from(userActivity.values()).sort(
        (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      ),
    });
  } catch (error: any) {
    console.error("Error fetching tracking data", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch tracking data" },
      { status: 500 }
    );
  }
}

