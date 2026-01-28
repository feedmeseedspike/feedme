"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "src/utils/supabase/client";
import { dismissNotificationAction } from "src/lib/actions/notifications.actions";
import { useToast } from "./useToast";

export interface Notification {
  id: number;
  user_id: string;
  type: "info" | "warning" | "error";
  body: string;
  link: string | null;
  dismissed: boolean;
  expires_at: string;
  created_at: string;
}

/**
 * Hook to manage real-time notifications from Supabase.
 */
export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const { showToast } = useToast();

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("dismissed", false)
      .gt("expires_at", now)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching notifications:", error);
    } else {
      setNotifications(data || []);
    }
    setIsLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`realtime-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const newNotification = payload.new as Notification;
          
          if (!newNotification.dismissed) {
             setNotifications((prev) => [newNotification, ...prev]);
             
             // native browser notification (Supabase-driven)
             if ("Notification" in window && Notification.permission === "granted") {
                // Play notification sound
                const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                audio.play().catch(e => console.log("Sound play blocked until user interaction"));

                const title = "FeedMe Update";
                const options: any = {
                  body: newNotification.body,
                  icon: "/icon.png",
                  vibrate: [200, 100, 200],
                  silent: false,
                  data: {
                    link: newNotification.link || '/'
                  }
                };

                // Try Service Worker first
                if ("serviceWorker" in navigator) {
                  navigator.serviceWorker.ready.then((registration) => {
                    registration.showNotification(title, options);
                  }).catch(() => {
                    if ("vibrate" in navigator) (navigator as any).vibrate([200, 100, 200]);
                    const noti = new window.Notification(title, options);
                    noti.onclick = () => {
                      window.focus();
                      if (newNotification.link) window.location.href = newNotification.link;
                    };
                  });
                } else {
                  if ("vibrate" in navigator) (navigator as any).vibrate([200, 100, 200]);
                  const noti = new window.Notification(title, options);
                  noti.onclick = () => {
                    window.focus();
                    if (newNotification.link) window.location.href = newNotification.link;
                  };
                }
             } else {
                showToast(`New Notification: ${newNotification.body}`, "info");
             }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const updatedNotification = payload.new as Notification;
          if (updatedNotification.dismissed) {
            setNotifications((prev) => prev.filter((n) => n.id !== updatedNotification.id));
          } else {
            setNotifications((prev) => 
               prev.map((n) => n.id === updatedNotification.id ? updatedNotification : n)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  const dismissNotification = async (id: number) => {
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    
    const result = await dismissNotificationAction(id);
    if (!result.success) {
      // Revert if failed
      fetchNotifications();
    }
  };

  const unreadCount = useMemo(() => notifications.length, [notifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    dismissNotification,
    refresh: fetchNotifications,
  };
}
