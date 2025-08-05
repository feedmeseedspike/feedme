"use server";

import admin from "@/utils/firebase/admin";
import { createClient } from "@/utils/supabase/server";

export async function sendPushNotification(
  title: string,
  body: string,
  userId: string
) {
  try {
    const supabase = await createClient();
    // Fetch all FCM tokens for the user (web and mobile)
    console.log({ userId });
    const { data: tokens, error: tokenError } = await supabase
      .from("fcm_tokens")
      .select("fcm_token, device_type")
      .eq("user_id", userId);
    console.log({ tokens });

    if (tokenError || !tokens || tokens.length === 0) {
      console.error("No FCM tokens found for user:", userId);
      return;
    }

    // Send notification to all user devices
    const message = {
      notification: { title, body },
      tokens: tokens.map((token) => token.fcm_token), // Multi-device support
    };

    try {
      // Use sendToDevice for multiple tokens
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log("Push notification sent:", response);

      // Log failed tokens (e.g., expired or invalid)
      if (response.failureCount > 0) {
        response.responses.forEach((resp: any, idx: any) => {
          if (!resp.success) {
            console.error(
              `Failed to send to token ${tokens[idx].fcm_token}:`,
              resp.error.message
            );
            // Optionally delete invalid tokens
            if (
              resp.error.code === "messaging/registration-token-not-registered"
            ) {
              supabase
                .from("fcm_tokens")
                .delete()
                .eq("fcm_token", tokens[idx].fcm_token)
                .then(() =>
                  console.log(`Deleted invalid token: ${tokens[idx].fcm_token}`)
                );
            }
          }
        });
      }
    } catch (err: any) {
      console.error("Error sending push notification:", err.message);
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
    const supabase = await createClient();
    const { error } = await supabase.from("fcm_tokens" as any).upsert({
      user_id: userId,
      fcm_token: token,
      device_type: type,
    });
  } catch (error: any) {
    console.log(error);
  }
}

export async function checkToken(userId: string, type: "web" | "mobile") {
  try {
    const supabase = await createClient();

    const { data: tokens, error: tokenError } = await supabase
      .from("fcm_tokens")
      .select("fcm_token, device_type, user_id")
      .eq("user_id", userId);
    console.log({ tokens }, { tokenError });
    const first = !tokens
      ? []
      : tokens
          .filter((it: any) => it.user_id === userId)
          .filter((its: any) => its.device_type === type);

    // Log all tokens for debugging
    console.log("FCM Tokens:", first);
    if (first.length === 0) {
      console.warn(`No FCM tokens found for user ${userId} on ${type} device`);
      return true;
    }
    return false;
  } catch (error: any) {
    console.error("Error checking FCM tokens:", error.message);
    return false
  }
}
