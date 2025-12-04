import { NextResponse } from "next/server";
import { createClient } from "@utils/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { data, error } = await supabase
      .from("black_friday_items")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Failed to fetch black friday item:", error);
      return NextResponse.json(
        { error: "Black Friday item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error("Error in GET /api/black-friday/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



