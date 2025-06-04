"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Wallet, Eye, EyeOff, TrendingUp, TrendingDown } from "lucide-react";
import { formatNaira } from "src/lib/utils";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSupabaseSession } from "@components/supabase-auth-provider";
import { useWalletBalanceQuery } from "src/queries/wallet";
import { Skeleton } from "@components/ui/skeleton";
import { useToast } from "src/hooks/useToast";

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  // description: string;
  date: string;
}

function WalletSummary({
  recentTransactions = [],
}: {
  recentTransactions?: Transaction[];
}) {
  const [showBalance, setShowBalance] = useState(true);
  const session = useSupabaseSession();
  const { showToast } = useToast();

  const {
    data: walletBalance,
    isLoading: isLoadingBalance,
    error: errorBalance,
  } = useWalletBalanceQuery(session?.user?.id || "");

  useEffect(() => {
    if (errorBalance) {
      // showToast({
    //     title: "Error fetching wallet balance",
    //     // description: errorBalance.message || "An unknown error occurred.",
    //     type: "error",
    //   });
    }
  }, [errorBalance, showToast]);

  const totalCredits = recentTransactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = recentTransactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Wallet Balance
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowBalance(!showBalance)}
        >
          {showBalance ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#1B6013]">
          {isLoadingBalance ? (
            <Skeleton className="h-8 w-32" />
          ) : errorBalance ? (
            "Error"
          ) : showBalance && walletBalance !== null ? (
            formatNaira(walletBalance)
          ) : (
            "****"
          )}
        </div>
        <p className="text-xs text-muted-foreground">Available balance</p>

        {recentTransactions.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="w-3 h-3" />
                <span>Credits: {formatNaira(totalCredits)}</span>
              </div>
              <div className="flex items-center gap-1 text-red-600">
                <TrendingDown className="w-3 h-3" />
                <span>Debits: {formatNaira(totalDebits)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <Link href="/account/wallet">
            <Button className="w-full bg-[#1B6013] hover:bg-[#1B6013]/90">
              View Wallet
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default WalletSummary;
