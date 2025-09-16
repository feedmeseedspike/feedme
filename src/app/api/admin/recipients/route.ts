import { NextResponse } from "next/server";
import { createClient as createServerComponentClient } from "@utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerComponentClient();

    // Base on profiles to ensure FK integrity with email_preferences
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, display_name");
    if (profilesError) throw profilesError;

    const userIds = (profiles || []).map((p: any) => p.user_id).filter(Boolean);

    // Fetch emails from public users table for these ids (non-auth)
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email")
      .in("id", userIds.length ? userIds : ["dummy"]);
    if (usersError) throw usersError;
    const emailByUserId: Record<string, string | null> = {};
    (users || []).forEach((u: any) => { emailByUserId[u.id] = u.email; });

    // Fetch email preferences for these user ids
    const { data: prefs } = await supabase
      .from("email_preferences" as any)
      .select("user_id, newsletter_enabled, promotional_enabled, transactional_enabled, updated_at")
      .in("user_id", userIds.length ? userIds : ["dummy"]);
    const prefsByUser: Record<string, any> = {};
    (prefs || []).forEach((p: any) => { prefsByUser[p.user_id] = p; });

    const rows = (profiles || []).map((p: any) => ({
      userId: p.user_id,
      name: p.display_name || "",
      email: emailByUserId[p.user_id] || null,
      preferences: prefsByUser[p.user_id] || null,
    })).filter((r: any) => !!r.email);

    return NextResponse.json({ success: true, recipients: rows });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Failed to load recipients" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, email, display_name, preferences } = body || {};
    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    const supabase = await createServerComponentClient();

    if (email !== undefined) {
      const { error: usersUpdateError } = await supabase
        .from("users")
        .update({ email })
        .eq("id", userId);
      if (usersUpdateError) throw usersUpdateError;
    }

    if (display_name !== undefined) {
      const { error: profilesUpdateError } = await supabase
        .from("profiles")
        .update({ display_name })
        .eq("user_id", userId);
      if (profilesUpdateError) throw profilesUpdateError;
    }

    if (preferences && typeof preferences === "object") {
      // Ensure a matching profile exists to satisfy FK constraint
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", userId)
        .single();
      if (profileError || !profile) {
        return NextResponse.json(
          { success: false, error: "No profile found for this user. Cannot update preferences." },
          { status: 400 }
        );
      }

      const upsertRow: any = { user_id: userId };
      if (preferences.newsletter_enabled !== undefined) upsertRow.newsletter_enabled = !!preferences.newsletter_enabled;
      if (preferences.promotional_enabled !== undefined) upsertRow.promotional_enabled = !!preferences.promotional_enabled;
      if (preferences.transactional_enabled !== undefined) upsertRow.transactional_enabled = !!preferences.transactional_enabled;

      const { error: prefError } = await supabase
        .from("email_preferences" as any)
        .upsert([upsertRow], { onConflict: "user_id" } as any);
      if (prefError) throw prefError;
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Failed to update recipient" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body || {};
    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    const supabase = await createServerComponentClient();
    // Soft-remove from recipients by disabling all email types
    const { error: prefError } = await supabase
      .from("email_preferences" as any)
      .upsert([
        {
          user_id: userId,
          newsletter_enabled: false,
          promotional_enabled: false,
          transactional_enabled: false,
        },
      ], { onConflict: "user_id" } as any);
    if (prefError) throw prefError;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Failed to remove recipient" },
      { status: 500 }
    );
  }
}


