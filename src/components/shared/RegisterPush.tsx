"use client";

import { useEffect } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "@/utils/firebase/firebase";
import { createClient } from "@/utils/supabase/client";

interface RegisterPushProps {
  userId: string;
}

export default function RegisterPush({ userId }: RegisterPushProps) {
  const supabase = createClient();
  useEffect(() => {
    const registerPush = async () => {
      try {
        const permission = await Notification.requestPermission();
        const { data: tokens, error: tokenError } = await supabase
          .from("fcm_tokens" as any)
          .select("fcm_token, device_type, user_id")
          .eq("user_id", userId);
        const first = !tokens
          ? []
          : tokens
              .filter((it: any) => it.user_id === userId)
              .filter((its: any) => its.device_type === "web");
        if (permission === "granted" && messaging) {
          const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
          });
          if (token && first.length === 0) {
            const { error } = await supabase.from("fcm_tokens" as any).upsert({
              user_id: userId,
              fcm_token: token,
              device_type: "web",
            });
            if (error) {
              console.error("Error saving FCM token:", error);
            }
          }
        } else if (permission !== "granted") {
          console.warn("Notification permission denied");
        }
      } catch (err) {
        console.error("Error registering push:", err);
      }
    };

    registerPush();

    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload: any) => {
      const { title, body } = payload.notification;

      new Notification(title, {
        body,
        icon: "/icon.png",
      });
    });

    return () => unsubscribe();
  }, [userId]);

  return null;
}
