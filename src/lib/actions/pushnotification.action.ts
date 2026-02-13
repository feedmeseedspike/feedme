"use server";

import { createServiceRoleClient } from "@/utils/supabase/server";

export async function sendPushNotification(
  title: string,
  body: string,
  userId: string,
  link?: string
) {
  try {
    const supabase = createServiceRoleClient();
    
    // 1. Fetch the subscriptions/tokens for the user
    const { data: tokens, error: tokenError } = await supabase
      .from("fcm_tokens")
      .select("fcm_token, device_type")
      .eq("user_id", userId);

    if (tokenError || !tokens || tokens.length === 0) {
      return;
    }

    // 2. Invoke the Supabase Edge Function to handle the actual push delivery
    // Note: 'push-notification' is a common name; adjust if yours is named differently.
    const { data, error: functionError } = await supabase.functions.invoke('push-notification', {
      body: {
        title,
        body,
        link: link || "/",
        tokens: tokens.map(t => t.fcm_token),
        userId
      },
    });

    if (functionError) {
      console.error("Supabase Function Error:", functionError);
    }
  } catch (err: any) {
    console.error("Error in sendPushNotification:", err.message);
  }
}

export async function getToken(
  userId: string,
  token: string,
  type: "web" | "mobile"
) {
  try {
    const supabase = await createServiceRoleClient();
    await supabase.from("fcm_tokens" as any).upsert({
      user_id: userId,
      fcm_token: token,
      device_type: type,
    });
  } catch (error: any) {
    console.error("Error saving token:", error.message);
  }
}

export async function checkToken(userId: string, type: "web" | "mobile") {
  try {
    const supabase = await createServiceRoleClient();
    const { data: tokens } = await supabase
      .from("fcm_tokens")
      .select("fcm_token")
      .eq("user_id", userId)
      .eq("device_type", type);

    return tokens && tokens.length > 0;
  } catch (error: any) {
    return false;
  }
}
