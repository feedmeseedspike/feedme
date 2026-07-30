export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { authMiddleware } from "middleware/auth";
import { getUser } from "@/lib/actions/auth.actions";
import { createClient } from "src/utils/supabase/server";

export const GET = authMiddleware(
  async (request: Request, user_id: string) => {
    try {
      const user = await getUser();
      return NextResponse.json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      console.error(error);
      return NextResponse.json(
        { message: "Server error", error: error.message },
        { status: 500 }
      );
    }
  }
);

export const PUT = authMiddleware(
  async (request: Request, user_id: string) => {
    try {
      const data = await request.json();
      const supabase = await createClient();
      
      const updateData: any = {};
      if (data.display_name !== undefined) updateData.display_name = data.display_name;
      if (data.phone_number !== undefined) updateData.phone_number = data.phone_number;
      if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;

      const { data: updatedProfile, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user_id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data: updatedProfile,
      });
    } catch (error: any) {
      console.error(error);
      return NextResponse.json(
        { message: "Server error", error: error.message },
        { status: 500 }
      );
    }
  }
);
