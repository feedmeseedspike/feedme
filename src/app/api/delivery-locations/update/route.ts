import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, price } = body;
    if (!id || !name || typeof price !== "number") {
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
    }
    const supabase = await createClient();
    const { error } = await supabase
      .from("delivery_locations")
      .update({ name, price })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
} 