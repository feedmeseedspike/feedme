"use client";

import { useEffect } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "@/utils/firebase/firebase";
import { createClient } from "@/utils/supabase/client";

export default function RegisterPush({ userId }: { userId: string }) {
  const supabase = createClient();
  console.log("userIds => ", userId);
  useEffect(() => {
    console.log("effect started");
    const registerPush = async () => {
      try {
        const permission = await Notification.requestPermission();
        console.log("permission ", permission);
        const { data: tokens, error: tokenError } = await supabase
          .from("fcm_tokens" as any)
          .select("fcm_token, device_type, user_id")
          .eq("user_id", userId);
        console.log({ tokens }, { tokenError });
        const first = !tokens
          ? []
          : tokens
              .filter((it: any) => it.user_id === userId)
              .filter((its: any) => its.device_type === "web");
        if (permission === "granted") {
          const token = await getToken(messaging as any, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
          });
          console.log({ token, first });
          if (token && first.length === 0) {
            const { error } = await supabase.from("fcm_tokens" as any).upsert({
              user_id: userId,
              fcm_token: token,
              device_type: "web",
            });
            if (error) {
              console.error("Error saving FCM token:", error);
            } else {
              console.log("FCM token saved:", token);
            }
          }
        } else {
          console.warn("Notification permission denied");
        }
      } catch (err) {
        console.error("Error registering push:", err);
      }
    };

    registerPush();

    const unsubscribe = onMessage(messaging as any, (payload: any) => {
      console.log("Received foreground message:", payload);
      const { title, body } = payload.notification;

      // Option 1: Show system notification
      //  if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/Footerlogo.png", // Optional: Add your app’s icon
      });
      //  }

      // Option 2: Show in-app notification (e.g., toast)
      // Example: You can integrate a toast library like react-toastify
      // toast.info(`${title}: ${body}`);
    });

    return () => unsubscribe();
  }, [userId]);

  return null;
}
