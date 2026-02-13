import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  try {
    const [{ data: publicUsers, error: usersError }, { data: profiles, error: profilesError }] = await Promise.all([
      supabaseAdmin.from("users").select("id, email, display_name"),
      supabaseAdmin.from("profiles").select("user_id, display_name"),
    ]);

    if (usersError) throw usersError;
    if (profilesError) throw profilesError;

    // Also fetch from Auth Admin API to be comprehensive
    const { data: authUsersData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    const authUsers = authUsersData?.users || [];

    const nameById = new Map<string, string | null>();
    (profiles ?? []).forEach((profile) => {
      nameById.set(profile.user_id, profile.display_name ?? null);
    });
    (publicUsers ?? []).forEach((user) => {
      if (!nameById.has(user.id)) nameById.set(user.id, user.display_name ?? null);
    });

    // Create a map to deduplicate by email
    const emailMap = new Map<string, { email: string; full_name: string | null }>();

    // Add public users
    (publicUsers ?? []).forEach((user) => {
      if (user.email) {
        emailMap.set(user.email.toLowerCase(), {
          email: user.email.toLowerCase(),
          full_name: nameById.get(user.id) || null,
        });
      }
    });

    // Add auth users
    authUsers.forEach((user) => {
      if (user.email) {
        const lowerEmail = user.email.toLowerCase();
        if (!emailMap.has(lowerEmail)) {
          emailMap.set(lowerEmail, {
            email: lowerEmail,
            full_name: nameById.get(user.id) || user.user_metadata?.display_name || null,
          });
        }
      }
    });

    const payload = Array.from(emailMap.values()).map(item => ({
      ...item,
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
