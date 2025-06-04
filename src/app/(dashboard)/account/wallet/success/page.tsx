"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabaseSession } from "@components/supabase-auth-provider";
import { useToast } from "src/hooks/useToast";

export default function WalletSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSupabaseSession();
  const { showToast } = useToast();

  useEffect(() => {
    const reference = searchParams.get("reference");
    if (reference && session?.access_token) {
      // Call verify endpoint
      fetch("/api/wallet/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ reference }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.message === "Transaction verified and wallet updated") {
            showToast("Payment successful! Wallet updated.", "success");
            // Optionally redirect after a delay
            setTimeout(() => {
              router.push("/dashboard/account/wallet");
            }, 2000);
          } else {
            showToast(data.message || "Verification failed.", "error");
          }
        })
        .catch((err) => {
          showToast("Verification error: " + err.message, "error");
        });
    }
  }, [searchParams, session, router, showToast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Payment Success</h1>
      <p className="mb-2">Verifying your payment...</p>
      <p className="text-gray-500">You will be redirected shortly.</p>
    </div>
  );
}