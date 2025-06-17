"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "src/hooks/useUser";
import { useToast } from "src/hooks/useToast";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Copy, Share2, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import { Skeleton } from "@components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns"; // Import date-fns for date formatting

const ReferralPage = () => {
  const { user, isLoading: isUserLoading } = useUser();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  // Query to check referral status and get code
  const {
    data: referralStatus,
    isLoading: isReferralStatusLoading,
    error: referralStatusError,
  } = useQuery({
    queryKey: ["referralStatus", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch("/api/referral/status");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch referral status");
      }
      return response.json();
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Query to fetch referred users history
  const {
    data: referredUsers,
    isLoading: isReferredUsersLoading,
    error: referredUsersError,
  } = useQuery({
    queryKey: ["referredUsers", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch("/api/referral/referred-users"); // We will create this API route next
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch referred users");
      }
      return response.json();
    },
    enabled: !!user?.id,
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
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
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
            user?.email || ""
          } when you sign up.`,
          url: `${
            window.location.origin
          }/register?referral_code=${encodeURIComponent(user?.email || "")}`,
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

    if (!user) {
      return (
        <div className="text-center text-gray-600">
          <p>Please log in to manage your referral program.</p>
        </div>
      );
    }

    const hasActivated = referralStatus?.data?.length > 0; 
    const userReferralCode = user.email;

    const referralsList = referredUsers?.data || [];

    // console.log("Referrals List:", referralsList);

    return (
      <div className="space-y-6">
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
          className="w-full bg-[#1B6013] hover:bg-green-700 text-white"
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
          <Card className="border-dashed border-2 border-gray-300 bg-gray-50 text-center py-10">
            <CardContent className="p-0">
              <p className="text-gray-500">
                No referrals yet. Share your code to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {referralsList.map((referral: any) => (
              <Card key={referral.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
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
                  <p className="text-sm text-gray-600 mb-1">
                    Purchase Amount: ₦
                    {(referral.referred_purchase_amount || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Referred on:{" "}
                    {format(new Date(referral.created_at), "MMM dd, yyyy")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Refer a Friend
          </CardTitle>
        </CardHeader>
        <CardContent>{renderReferralContent()}</CardContent>
      </Card>
    </div>
  );
};

export default ReferralPage;
