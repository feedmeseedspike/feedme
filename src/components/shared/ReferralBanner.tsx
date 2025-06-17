"use client";

import Link from "next/link";
import { Button } from "@components/ui/button";
import { Gift, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ReferralBannerProps {
  hasReferralStatus: boolean;
}

const ReferralBanner = ({ hasReferralStatus }: ReferralBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // If the user has an active referral status, always hide the banner.
    if (hasReferralStatus) {
      setIsVisible(false);
      return; // Exit early
    }

    // Otherwise, check local storage for dismissal preference.
    const dismissed = localStorage.getItem("referralBannerDismissed");
    if (dismissed === "true") {
      setIsVisible(false);
    }
  }, [hasReferralStatus]); // Rerun effect when hasReferralStatus changes

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("referralBannerDismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="bg-[#1B6013]/90 text-white py-2 px-4 text-center text-sm flex items-center justify-center gap-2 flex-wrap relative">
      <Gift className="w-5 h-5 text-white" />
      <p className="font-medium">
        Refer a friend and get ₦2,000 off your next purchase!
      </p>
      <Link
        href="/account/referral"
        className="underline hover:no-underline font-semibold"
      >
        <Button variant="link" className="text-white p-0 h-auto leading-none">
          Learn More
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
      >
        <X className="w-4 h-4" />
        <span className="sr-only">Close banner</span>
      </Button>
    </div>
  );
};

export default ReferralBanner;
