"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const BottomNav = dynamic(() => import("@components/shared/BottomNav"), {
  ssr: false,
});

export default function BottomNavClientWrapper() {
  const pathname = usePathname();

  if (
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.includes("/auth/")
  ) {
    return null;
  }

  return <BottomNav />;
}
