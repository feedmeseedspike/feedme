"use client";

import { usePathname } from "next/navigation";
import React, { Suspense } from "react";
import dynamic from "next/dynamic";

import BottomNav from "@components/shared/BottomNav";


const DynamicWhatsAppButton = dynamic(
  () => import("@components/WhatsAppButton"),
  {
    ssr: false,
    loading: () => null,
  }
);

// const DynamicAIFloatingChat = dynamic(
//   () => import("@components/shared/ai/AnimatedAIFloatingChat"),
//   {
//     ssr: false,
//     loading: () => null,
//   }
// );

interface PathnameProviderProps {
  children: React.ReactNode;
  hasReferralStatus: boolean;
}

export function PathnameProvider({
  children,
  hasReferralStatus,
}: PathnameProviderProps) {
  const pathname = usePathname();

  const hideOnPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/auth",
    "/admin",
    "/product",
  ];
  const shouldHideNavAndBanner = hideOnPaths.some((path) =>
    pathname?.startsWith(path)
  );

  return (
    <>
      {children}
      {!shouldHideNavAndBanner && <BottomNav />}
      {!shouldHideNavAndBanner && (
        <DynamicWhatsAppButton
          phoneNumber="+2348088282487"
          message="Hello! I have a question about your products."
        />
      )}
      {/* {!shouldHideNavAndBanner && (
        <DynamicAIFloatingChat />
      )} */}
    </>
  );
}
