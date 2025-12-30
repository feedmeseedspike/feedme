import supabaseAdmin from "@/utils/supabase/admin";
import AnnouncementBannerClient from "./announcement-banner-client";

export default async function AnnouncementBanner() {
  // Use admin client to ensure we can read settings regardless of RLS
  const { data: settings } = await supabaseAdmin
    .from("store_settings")
    .select("*")
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (!settings || !settings.is_announcement_enabled || !settings.announcement_message) {
    return null;
  }

  const now = new Date();
  const start = settings.announcement_start_at ? new Date(settings.announcement_start_at) : null;
  const end = settings.announcement_end_at ? new Date(settings.announcement_end_at) : null;

  if (start && now < start) return null;
  if (end && now > end) return null;

  return <AnnouncementBannerClient message={settings.announcement_message} />;
}
