"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useUser } from "src/hooks/useUser";
import { useToast } from "src/hooks/useToast";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import {
  Copy,
  Share2,
  Loader2,
  CheckCircle,
  XCircle,
  User,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import {
  UserGroupIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { Separator } from "@components/ui/separator";
import { Skeleton } from "@components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const ReferralPage = () => {
  const { user, isLoading: isUserLoading } = useUser();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  // Normalize user object for compatibility
  const normalizedUser = user
    ? {
        id: (user as any).id || (user as any).user_id || "",
        email: (user as any).email || "",
        ...user,
      }
    : null;

  // Use normalizedUser instead of user
  const userId = normalizedUser?.id;
  const userEmail = normalizedUser?.email;

  // Query to check referral status and get code
  const {
    data: referralStatus,
    isLoading: isReferralStatusLoading,
    error: referralStatusError,
  } = useQuery({
    queryKey: ["referralStatus", userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await fetch("/api/referral/status");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch referral status");
      }
      return response.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Query to fetch referred users history
  const {
    data: referredUsers,
    isLoading: isReferredUsersLoading,
    error: referredUsersError,
  } = useQuery({
    queryKey: ["referredUsers", userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await fetch("/api/referral/referred-users"); // We will create this API route next
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch referred users");
      }
      return response.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Mutation to activate referral program
  const activateReferralMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/referral/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to activate referral program");
      }
      return data;
    },
    onSuccess: (data) => {
      showToast(data.message || "Referral program activated!", "success");
      queryClient.invalidateQueries({ queryKey: ["referralStatus"] }); // Refresh status
      queryClient.invalidateQueries({ queryKey: ["referredUsers"] }); // Also refresh referred users
    },
    onError: (error) => {
      showToast(error.message || "Error activating referral program", "error");
    },
  });

  const handleCopy = () => {
    if (userEmail) {
      navigator.clipboard.writeText(userEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast("Referral code copied!", "success");
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
      showToast("Web Share API is not supported in your browser.", "info");
      handleCopy();
    }
  };

  const renderReferralContent = () => {
    if (isUserLoading || isReferralStatusLoading || isReferredUsersLoading) {
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

    if (referralStatusError || referredUsersError) {
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

    const hasActivated = referralStatus?.data?.length > 0;
    const userReferralCode = userEmail;

    const referralsList = referredUsers?.data || [];

    // console.log("Referrals List:", referralsList);

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
              onClick={() => activateReferralMutation.mutate()}
              disabled={activateReferralMutation.isPending}
              className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {activateReferralMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Activate Now
            </Button>
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
};

export default ReferralPage;
