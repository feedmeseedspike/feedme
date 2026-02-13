"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface RegisterPushProps {
  userId: string;
}

export default function RegisterPush({ userId }: RegisterPushProps) {
  const supabase = createClient();

  useEffect(() => {
    const registerPush = async () => {
      try {
        // 1. Request Permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("Notification permission not granted:", permission);
          return;
        }

        // 2. Register Service Worker & Get Subscription
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready;
          
          // Get or create native push subscription
          let subscription = await registration.pushManager.getSubscription();
          
          if (!subscription) {
            const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
            if (!vapidKey) {
              console.error("Missing VAPID key for push registration");
              return;
            }

            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: vapidKey
            });
          }

          if (subscription) {
            // 3. Save to Supabase (using existing fcm_tokens table but storing JSON)
            const subscriptionJson = JSON.stringify(subscription);
            
            const { data: existingToken } = await supabase
              .from("fcm_tokens" as any)
              .select("id")
              .eq("user_id", userId)
              .eq("fcm_token", subscriptionJson)
              .maybeSingle();

            if (!existingToken) {
              console.log("Saving fresh Push Subscription to Supabase");
              await supabase.from("fcm_tokens" as any).upsert({
                user_id: userId,
                fcm_token: subscriptionJson,
                device_type: "web",
              });
            }
          }
        }
      } catch (err) {
        console.error("Error registering native push:", err);
      }
    };

    registerPush();
  }, [userId, supabase]);

  return null;
}
