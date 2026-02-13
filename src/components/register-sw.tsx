// components/RegisterSW.tsx
"use client";
import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Register the main service worker for PWA and Push Notifications
      navigator.serviceWorker
        .register("/sw.js") // Root scope is required for global push handling
        .then((registration) => {
          // Service Worker registered successfully
        })
        .catch((err) => {
          console.error("Service Worker registration failed:", err);
        });
    }
  }, []);

  return null;
}
