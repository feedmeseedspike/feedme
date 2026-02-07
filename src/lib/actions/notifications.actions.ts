"use server";

import { createClient, createServiceRoleClient } from "src/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { sendPushNotification } from "./pushnotification.action";

export type NotificationType = "info" | "warning" | "error";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  body: string;
  link?: string;
  expiresAt?: string;
}

/**
 * Creates a new notification for a specific user in Supabase.
 * This should be called from server-side logic (Actions, Route Handlers).
 */
export async function createNotification({
  userId,
  type,
  body,
  link,
  expiresAt,
}: CreateNotificationParams) {
  const supabase = createServiceRoleClient(); // Use service role to bypass RLS

  // If expiresAt is not provided, default to 1 month from now
  const expiry = expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type: type,
      body: body,
      link: link || null,
      dismissed: false,
      expires_at: expiry,
    })
    .select()
    .single();

  if (error) {
    // error code 23503: foreign key violation (user does not exist)
    if (error.code === '23503') {
      // console.warn(`Skipping notification for non-existent user: ${userId}`);
      return { success: false, error: "User not found" };
    }
    console.error("Error creating notification:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

/**
 * Marks a notification as dismissed.
 */
export async function dismissNotificationAction(notificationId: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ dismissed: true })
    .eq("id", notificationId);

  if (error) {
    console.error("Error dismissing notification:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Marks all notifications as dismissed for the current user.
 */
export async function dismissAllNotificationsAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("notifications")
    .update({ dismissed: true })
    .eq("user_id", user.id)
    .eq("dismissed", false);

  if (error) {
    console.error("Error dismissing all notifications:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Sends a notification through both Supabase (in-app) and Firebase (push).
 */
export async function sendUnifiedNotification({
  userId,
  type,
  title,
  body,
  link,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}) {
  // 1. Create In-App Notification (Supabase)
  const inAppResult = await createNotification({
    userId,
    type,
    body: title ? `${title}: ${body}` : body,
    link,
  });

  // 2. Send Push Notification (Firebase) - Optional Fallback
  try {
     // We don't want Firebase failures to break the flow or show errors to the user
     // since we are prioritizing Supabase Realtime now.
     await sendPushNotification(title || "New Notification", body, userId);
  } catch (err) {
     console.warn("Firebase Push (Optional) skipped or failed:", err);
  }

  return inAppResult;
}

/**
 * Sends a notification to ALL users currently registered in the profiles table.
 * Use this sparingly for major updates like price changes or new arrivals.
 */
export async function sendBroadcastNotification({
  type,
  title,
  body,
  link,
}: {
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}) {
  const supabase = await createClient();
  
  // 1. Fetch all user IDs
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("user_id");

  if (error || !profiles) {
    console.error("Broadcast failed to fetch profiles:", error);
    return { success: false, error: "Cloud not fetch users for broadcast" };
  }

  const userIds = profiles.map(p => p.user_id).filter(Boolean);
  const results = [];

  // 2. Send to each user
  const BATCH_SIZE = 50;
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(batch.map(userId => 
      sendUnifiedNotification({
        userId,
        type,
        title,
        body,
        link
      })
    ));
  }

  return { success: true, count: userIds.length };
}


