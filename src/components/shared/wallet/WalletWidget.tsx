"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Wallet, Plus, ArrowRight } from "lucide-react";
import { formatNaira } from "src/lib/utils";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSupabaseSession } from "@components/supabase-auth-provider";
import { useRouter } from "next/navigation";
import { useWalletBalanceQuery } from "../../../queries/wallet";
import { Skeleton } from "@components/ui/skeleton";
import { useToast } from "src/hooks/useToast";
import axios from "axios";

function WalletWidget({
  recentTransactionCount = 0,
}: {
  recentTransactionCount?: number;
}) {
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const session = useSupabaseSession();
  const router = useRouter();
  const { showToast } = useToast();

  const {
    data: walletBalance,
    isLoading: isLoadingBalance,
    error: errorBalance,
  } = useWalletBalanceQuery(session?.user?.id || "");

  useEffect(() => {
    if (errorBalance) {
      showToast(
        errorBalance.message ||
          "An unknown error occurred while fetching wallet balance.",
        "error"
      );
    }
  }, [errorBalance, showToast]);

  const handleAddFundsClick = async () => {
    if (!session || !session.user || !session.user.email) {
      showToast("Please sign in to add funds.", "warning");
      return;
    }

    setIsInitializingPayment(true);

    try {
      const amountToFund = 5000;

      const response = await axios.post(
        "/api/wallet/initialize",
        {
          email: session.user.email,
          amount: amountToFund,
        },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.data.authorization_url) {
        router.push(response.data.authorization_url);
      } else {
        showToast(
          "Payment initialization failed: Could not get authorization URL from Paystack.",
          "error"
        );
        console.error("Payment initialization response:", response.data);
      }
    } catch (err: any) {
      showToast(
        err.response?.data?.message ||
          "An error occurred during payment initialization.",
        "error"
      );
      console.error("Error initiating payment:", err);
    } finally {
      setIsInitializingPayment(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-[#1B6013] to-[#2d7a1f] text-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Wallet
        </CardTitle>
        <Button
          size="sm"
          variant="ghost"
          className="text-white hover:bg-white/20"
          asChild
        >
          <Link href="/account/wallet">
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoadingBalance ? (
            <Skeleton className="h-8 w-32" />
          ) : errorBalance ? (
            "Error"
          ) : walletBalance !== null ? (
            formatNaira(walletBalance)
          ) : (
            "N/A"
          )}
        </div>
        <p className="text-xs text-white/80">Available balance</p>

        {recentTransactionCount > 0 && (
          <p className="text-xs text-white/80 mt-2">
            {recentTransactionCount} recent transactions
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            className="bg-white text-[#1B6013] hover:bg-white/90 flex-1"
            onClick={handleAddFundsClick}
            disabled={
              isInitializingPayment ||
              isLoadingBalance ||
              Boolean(errorBalance) ||
              !session
            }
          >
            {isInitializingPayment ? (
              "Processing..."
            ) : (
              <>
                <Plus className="w-3 h-3 mr-1" />
                Add Funds
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white text-white hover:bg-white/20 flex-1"
            asChild
          >
            <Link href="/account/wallet">View Wallet</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default WalletWidget;
