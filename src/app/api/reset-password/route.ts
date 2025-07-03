import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  const { email, newPassword } = await req.json();

  // Find user by email
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, email")
    .eq("email", email)
    .single();

  if (userError || !user) {
    return NextResponse.json({ success: false, error: "No user found with that email." }, { status: 404 });
  }

  // Update password
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });

  if (updateError) {
    return NextResponse.json({ success: false, error: updateError.message }, { status: 400 });
  }

  // Optionally: send a notification email here

  return NextResponse.json({ success: true });
} 