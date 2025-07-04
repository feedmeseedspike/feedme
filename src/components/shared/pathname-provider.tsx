"use client";

import { usePathname } from "next/navigation";
import React, { Suspense } from "react";
import dynamic from "next/dynamic";

import BottomNav from "@components/shared/BottomNav";

const DynamicReferralBanner = dynamic(
  () => import("@components/shared/ReferralBanner"),
  {
    ssr: false,
    loading: () => null,
  }
);

const DynamicWhatsAppButton = dynamic(
  () => import("@components/WhatsAppButton"),
  {
    ssr: false,
    loading: () => null,
  }
);

interface PathnameProviderProps {
  children: React.ReactNode;
  hasReferralStatus: boolean;
}

export function PathnameProvider({
  children,
  hasReferralStatus,
}: PathnameProviderProps) {
  const pathname = usePathname();

  const hideOnPaths = ["/login", "/register", "/auth", "/admin"];
  const shouldHideNavAndBanner = hideOnPaths.some((path) =>
    pathname?.startsWith(path)
  );

  return (
    <>
      {!shouldHideNavAndBanner && (
        <DynamicReferralBanner hasReferralStatus={hasReferralStatus} />
      )}
      {children}
      {!shouldHideNavAndBanner && <BottomNav />}
      {!shouldHideNavAndBanner && (
        <DynamicWhatsAppButton
          phoneNumber="+2348144602273"
          message="Hello! I have a question about your products."
        />
      )}
    </>
  );
}
