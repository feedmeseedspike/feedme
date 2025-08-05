// components/RegisterSW.tsx
"use client";
import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Register PWA service worker with a custom scope
      navigator.serviceWorker
        .register("/sw.js", { scope: "/pwa/" })
        .then((registration) => {
          console.log("PWA Service Worker registered:", registration);
        })
        .catch((err) => {
          console.error("PWA Service Worker registration failed:", err);
        });

      // Register Firebase service worker
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          console.log("Firebase Service Worker registered:", registration);
        })
        .catch((err) => {
          console.error("Firebase Service Worker registration failed:", err);
        });
    }
  }, []);

  return null;
}
