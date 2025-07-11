"use client";
import React, { useState } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import {
  Copy,
  Share2,
  Loader2,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react";
import {
  UserGroupIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { Separator } from "@components/ui/separator";
import { Skeleton } from "@components/ui/skeleton";
import { format } from "date-fns";

interface ReferralClientProps {
  user: any;
  referralStatus: any;
  referredUsers: any;
  isLoading?: boolean;
  error?: string | null;
}

export default function ReferralClient({
  user,
  referralStatus,
  referredUsers,
  isLoading,
  error,
}: ReferralClientProps) {
  const [copied, setCopied] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [activated, setActivated] = useState(false);

  // Normalize user object for compatibility
  const normalizedUser = user
    ? {
        id: user.id || user.user_id || "",
        ...user,
      }
    : null;

  const userEmail = normalizedUser?.email;

  const handleCopy = () => {
    if (userEmail) {
      navigator.clipboard.writeText(userEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "FeedMe Referral",
          text: `Get a discount on FeedMe! Use my referral code (my email): ${
            userEmail || ""
          } when you sign up.`,
          url: `${
            window.location.origin
          }/register?referral_code=${encodeURIComponent(userEmail || "")}`,
        })
        .catch((error) => console.error("Error sharing:", error));
    } else {
      handleCopy();
    }
  };

  const handleActivate = async () => {
    setActivating(true);
    setActivateError(null);
    try {
      const response = await fetch("/api/referral/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (!response.ok) {
        setActivateError(data.message || "Failed to activate referral program");
      } else {
        setActivated(true);
      }
    } catch (err: any) {
      setActivateError(err.message || "Error activating referral program");
    } finally {
      setActivating(false);
    }
  };

  const renderReferralContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-600">
          <XCircle className="mx-auto w-12 h-12 mb-4" />
          <p>Error loading referral data. Please try again later.</p>
        </div>
      );
    }

    if (!normalizedUser) {
      return (
        <div className="text-center text-gray-600">
          <p>Please log in to manage your referral program.</p>
        </div>
      );
    }

    const hasActivated = activated || referralStatus?.data?.length > 0;
    const userReferralCode = userEmail;
    const referralsList = referredUsers?.data || [];

    return (
      <div className="space-y-6">
        {/* Your Referral Code Section */}
        <h2 className="text-xl font-semibold text-gray-800">
          Your Referral Code
        </h2>
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            readOnly
            value={userReferralCode || "Loading..."}
            className="flex-1 h-12 bg-gray-50 border-gray-200 text-gray-700 rounded-lg cursor-text"
          />
          <Button
            onClick={handleCopy}
            variant="outline"
            className="h-12 w-12 p-0 flex-shrink-0"
          >
            {copied ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
            <span className="sr-only">Copy code</span>
          </Button>
        </div>
        <Button
          onClick={handleShare}
          className="w-full bg-[#1B6013] hover:bg-[#1B6013]/90 text-white"
        >
          <Share2 className="mr-2 h-5 w-5" /> Share Your Code
        </Button>

        {!hasActivated && (
          <div
            className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-md"
            role="alert"
          >
            <p className="font-bold">Activate Your Referral Program!</p>
            <p className="text-sm">
              Click the button below to start referring friends and earning
              discounts.
            </p>
            <Button
              onClick={handleActivate}
              disabled={activating}
              className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {activating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Activate Now
            </Button>
            {activateError && (
              <div className="text-red-600 mt-2 text-sm">{activateError}</div>
            )}
          </div>
        )}

        <Separator />

        <h3 className="text-lg font-semibold text-gray-800">
          Referral History
        </h3>

        {referralsList.length === 0 ? (
          <div className="text-center text-gray-500">
            <p>No referrals yet. Share your code to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {referralsList.map((referral: any) => (
              <div key={referral.id} className="shadow-sm">
                <div className="flex justify-between items-center p-4">
                  <p className="font-semibold text-gray-700">
                    {referral.referred_user_email}
                  </p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      referral.status === "qualified"
                        ? "bg-green-100 text-green-800"
                        : referral.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {referral.status.charAt(0).toUpperCase() +
                      referral.status.slice(1)}
                  </span>
                </div>
                <div className="p-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">
                    Purchase Amount: ₦
                    {(referral.referred_purchase_amount || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Referred On:{" "}
                    {format(new Date(referral.created_at), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <Separator className="my-6" />

        {/* How It Works Section */}
        <h2 className="text-2xl font-bold text-gray-800">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg shadow-sm">
            <UserGroupIcon className="w-10 h-10 text-[#1B6013] mb-3" />
            <p className="text-gray-600 text-sm">
              Refer friends using e-mail or your invitation URL.
              <br />
              You can receive a ₦2,000 account credit per new customer referred.
            </p>
          </div>
          <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg shadow-sm">
            <ShoppingBagIcon className="w-10 h-10 text-[#1B6013] mb-3" />
            <p className="text-gray-600 text-sm">
              Your friend must click on the email or link.
              <br />
              Then, when they place their first order for ₦5,000 or more,
              they&apos;ll receive their discount.
            </p>
          </div>
          <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg shadow-sm">
            <CurrencyDollarIcon className="w-10 h-10 text-[#1B6013] mb-3" />
            <p className="text-gray-600 text-sm">
              Enjoy your ₦2,000 store credit!
              <br />
              After your friend places their first order, you&apos;ll receive
              ₦2,000 to your account (you must have already placed at least one
              order with us).
            </p>
          </div>
        </div>

        <Separator className="my-6" />
      </div>
    );
  };

  return (
    <div className="min-h-screen md:px-6">
      <div className="max-w-4xl mx-auto space-y-3">
        <div className="">
          <div className="pb-6 border-b border-gray-200 mb-3">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <User className="w-6 h-6 text-[#1B6013]" />
              Referral Program
            </h2>
            <p className="text-gray-600">
              Share your unique referral code with friends and earn rewards!
            </p>
          </div>
          {renderReferralContent()}
        </div>
      </div>
    </div>
  );
}
