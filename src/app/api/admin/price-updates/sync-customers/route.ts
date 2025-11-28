import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  try {
    const [{ data: users, error: usersError }, { data: profiles, error: profilesError }] = await Promise.all([
      supabaseAdmin.from("users").select("id, email"),
      supabaseAdmin.from("profiles").select("user_id, display_name"),
    ]);

    if (usersError) throw usersError;
    if (profilesError) throw profilesError;

    const nameById = new Map<string, string | null>();
    (profiles ?? []).forEach((profile) => {
      nameById.set(profile.user_id, profile.display_name ?? null);
    });

    const payload = (users ?? [])
      .filter((user) => user.email)
      .map((user) => ({
        email: user.email,
        full_name: nameById.get(user.id ?? "") ?? null,
        is_active: true,
        segments: [],
      }));

    if (!payload.length) {
      return NextResponse.json({ success: false, error: "No user emails found" }, { status: 400 });
    }

    const { error: upsertError } = await supabaseAdmin
      .from("price_update_subscriptions")
      .upsert(payload, { onConflict: "email" });

    if (upsertError) throw upsertError;

    return NextResponse.json({ success: true, synced: payload.length });
  } catch (error: any) {
    console.error("Failed to sync customers", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to sync customers" },
      { status: 500 }
    );
  }
}
