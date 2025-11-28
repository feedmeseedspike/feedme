import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { v4 as uuidv4 } from "uuid";

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("price_update_subscriptions")
      .select("id, email, full_name, segments, is_active, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, subscriptions: data ?? [] });
  } catch (error: any) {
    console.error("Failed to fetch price update subscriptions", error);
    return errorResponse(error?.message || "Failed to fetch subscriptions", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : null;
    const segments = Array.isArray(body.segments)
      ? body.segments.filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
      : [];

    if (!email || !email.includes("@")) {
      return errorResponse("Valid email is required");
    }

    const { data, error } = await supabaseAdmin
      .from("price_update_subscriptions")
      .insert({
        id: uuidv4(),
        email,
        full_name: fullName,
        segments,
        is_active: body.isActive !== false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return errorResponse("Email already subscribed", 409);
      }
      throw error;
    }

    return NextResponse.json({ success: true, subscription: data });
  } catch (error: any) {
    console.error("Failed to create subscription", error);
    return errorResponse(error?.message || "Failed to create subscription", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id = typeof body.id === "string" ? body.id : null;
    if (!id) return errorResponse("Subscription id is required");

    const updates: Record<string, any> = {};
    if (typeof body.email === "string") updates.email = body.email.trim();
    if (typeof body.fullName === "string") updates.full_name = body.fullName.trim();
    if (typeof body.isActive === "boolean") updates.is_active = body.isActive;
    if (Array.isArray(body.segments)) {
      updates.segments = body.segments.filter(
        (value: unknown): value is string => typeof value === "string" && value.trim().length > 0
      );
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse("No valid fields to update");
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("price_update_subscriptions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, subscription: data });
  } catch (error: any) {
    console.error("Failed to update subscription", error);
    return errorResponse(error?.message || "Failed to update subscription", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const id = typeof body.id === "string" ? body.id : null;
    if (!id) return errorResponse("Subscription id is required");

    const { error } = await supabaseAdmin
      .from("price_update_subscriptions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete subscription", error);
    return errorResponse(error?.message || "Failed to delete subscription", 500);
  }
}
