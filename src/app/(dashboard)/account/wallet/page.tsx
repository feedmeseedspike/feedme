"use client";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import {
  Wallet,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Eye,
  EyeOff,
  CreditCard,
  Banknote,
  Smartphone,
} from "lucide-react";
import { formatNaira } from "src/lib/utils";
import { useSupabaseSession } from "@components/supabase-auth-provider";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useWalletBalanceQuery,
  useTransactionsQuery,
  useAddFundsMutation,
} from "src/queries/wallet";
import { Skeleton } from "@components/ui/skeleton";
import { useToast } from "src/hooks/useToast";
import { useQueryClient } from "@tanstack/react-query";
import { Tables } from "src/utils/database.types";

type Transaction = Tables<"transactions">;

export default function WalletPage() {
  const [showBalance, setShowBalance] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const session = useSupabaseSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const verificationAttempted = useRef(false);

  // console.log("WalletPage component rendering.");
  // console.log("Initial session:", session);

  const {
    data: walletBalance,
    isLoading: isLoadingBalance,
    error: errorBalance,
  } = useWalletBalanceQuery(session?.user?.id || "");
  const {
    data: transactions,
    isLoading: isLoadingTransactions,
    error: errorTransactions,
  } = useTransactionsQuery(session?.user?.id || "");

  const addFundsMutation = useAddFundsMutation();

  useEffect(() => {
    // console.log("Session or transaction loading state changed.");
    // console.log("Current session:", session);
    // console.log("User ID:", session?.user?.id);
    // console.log("isLoadingTransactions:", isLoadingTransactions);
    // console.log("Transactions data:", transactions);
    if (errorBalance) {
      showToast(
        errorBalance.message ||
          "An unknown error occurred while fetching wallet balance.",
        "error"
      );
    }
  }, [session, isLoadingTransactions, transactions, errorBalance, showToast]);

  useEffect(() => {
    if (errorTransactions) {
      showToast(
        errorTransactions.message ||
          "An unknown error occurred while fetching transactions.",
        "error"
      );
    }
  }, [errorTransactions, showToast]);

  useEffect(() => {
    const reference = searchParams.get("reference");

    if (reference && session && !verificationAttempted.current) {
      verificationAttempted.current = true;

      const verifyPayment = async (ref: string) => {
        try {
          // console.log(`Verifying transaction with reference: ${ref}`);
          const response = await fetch("/api/wallet/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ reference: ref }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            const errorMessage =
              errorData.message || "Transaction verification failed.";
            console.error(errorMessage);
            showToast(`Verification failed: ${errorMessage}`, "error");

            return;
          } else {
            const data = await response.json();
            console.log("Transaction verified successfully:", data);
            showToast("Transaction verified successfully!", "success");

            queryClient.invalidateQueries({
              queryKey: ["wallet", "balance", session.user.id],
            });
            queryClient.invalidateQueries({
              queryKey: ["wallet", "transactions", session.user.id],
            });
          }
        } catch (err: any) {
          console.error("Error during transaction verification:", err);
          showToast(`Verification error: ${err.message}`, "error");
        } finally {
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.delete("reference");
          router.replace(currentUrl.toString());
        }
      };

      verifyPayment(reference);
    } else if (!reference) {
      verificationAttempted.current = false;
    }
  }, [searchParams, session, router, queryClient, showToast]);

  const handleAddFundsContinue = async () => {
    if (!session || !session.user || !session.user.email) {
      showToast("Please sign in to add funds.", "warning");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      showToast("Please enter a valid amount.", "warning");
      return;
    }

    const amountInBaseUnit = parseFloat(amount);

    try {
      addFundsMutation.mutate(
        {
          email: session.user.email,
          amount: amountInBaseUnit,
        },
        {
          onSuccess: (data) => {
            if (data.authorization_url) {
              router.push(data.authorization_url);
              setIsAddFundsOpen(false);
            } else {
              showToast(
                "Payment initialization failed: Could not get authorization URL from Paystack.",
                "error"
              );
              console.error("Payment initialization response:", data);
            }
          },
          onError: (error: any) => {
            showToast(
              `Failed to initialize payment: ${
                error.message || "Unknown error"
              }`,
              "error"
            );
            console.error("Add funds mutation failed:", error);
          },
        }
      );
    } catch (err: any) {
      showToast(err.message || "An unexpected error occurred.", "error");
      console.error("Error in handleAddFundsContinue:", err);
    }
  };

  const filteredTransactions = (transactions || []).filter((transaction) => {
    const description = transaction.description || "";
    const matchesSearch = description
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    let matchesFilter = false;
    if (filterType === "all") {
      matchesFilter = true;
    } else if (filterType === "credit") {
      matchesFilter = transaction.amount >= 0;
    } else if (filterType === "debit") {
      matchesFilter = transaction.amount < 0;
    }

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTransactionIcon = (amount: number) => {
    return amount >= 0 ? (
      <ArrowDownLeft className="w-4 h-4 text-green-600" />
    ) : (
      <ArrowUpRight className="w-4 h-4 text-red-600" />
    );
  };

  const formatTransactionDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return dateString
      ? new Date(dateString).toLocaleDateString(undefined, options)
      : "N/A";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
          <p className="text-gray-600">Manage your wallet and transactions</p>
        </div>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-[#1B6013] to-[#2d7a1f]">
        <CardHeader className="text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-6 h-6" />
              <CardTitle className="text-lg">Wallet Balance</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalance(!showBalance)}
              className="text-white hover:bg-white/20"
            >
              {showBalance ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="text-white">
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-bold">
                {isLoadingBalance ? (
                  <Skeleton className="h-8 w-40" />
                ) : errorBalance ? (
                  errorBalance.message &&
                  errorBalance.message.includes("User not authenticated") ? (
                    "Please log in to view balance."
                  ) : (
                    "Error loading balance."
                  )
                ) : walletBalance !== null ? (
                  formatNaira(walletBalance)
                ) : (
                  "N/A"
                )}
              </p>
              <p className="text-white/80 text-sm">Available Balance</p>
            </div>
            <div className="flex gap-3">
              <Dialog open={isAddFundsOpen} onOpenChange={setIsAddFundsOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white text-[#1B6013] hover:bg-white/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Funds
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Funds to Wallet</DialogTitle>
                    <DialogDescription>
                      Choose your preferred payment method to add funds to your
                      wallet.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Amount</label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Payment Method
                      </label>
                      <Select
                        value={paymentMethod}
                        onValueChange={setPaymentMethod}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              Bank Transfer
                            </div>
                          </SelectItem>
                          <SelectItem value="card">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4" />
                              Debit/Credit Card
                            </div>
                          </SelectItem>
                          <SelectItem value="ussd">
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4" />
                              USSD
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddFundsOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-[#1B6013] hover:bg-[#1B6013]/90"
                      onClick={handleAddFundsContinue}
                      disabled={
                        addFundsMutation.status === "pending" ||
                        !session ||
                        !amount ||
                        parseFloat(amount) <= 0
                      }
                    >
                      {addFundsMutation.status === "pending"
                        ? "Adding..."
                        : "Continue"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction History</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoadingTransactions ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))
            ) : errorTransactions ? (
              errorTransactions.message &&
              errorTransactions.message.includes("User not authenticated") ? (
                <div className="text-center text-yellow-600">
                  Please log in to view transactions.
                </div>
              ) : (
                <div className="text-center text-red-500">
                  Error loading transactions.
                </div>
              )
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center text-gray-500">
                No transactions found.
              </div>
            ) : (
              filteredTransactions.map((transaction, index) => (
                <div key={transaction.id}>
                  <div
                    className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    onClick={() => setSelectedTransaction(transaction)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-full">
                        {getTransactionIcon(transaction.amount)}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          {formatTransactionDate(transaction.created_at)} •{" "}
                          {transaction.reference}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {transaction.payment_gateway && (
                            <span className="text-xs text-gray-500">
                              Via {transaction.payment_gateway}
                            </span>
                          )}
                          {transaction.payment_status && (
                            <Badge
                              className={getStatusColor(
                                transaction.payment_status
                              )}
                            >
                              {transaction.payment_status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          transaction.amount >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.amount >= 0 ? "+" : "-"}
                        {formatNaira(Math.abs(transaction.amount))}
                      </p>
                    </div>
                  </div>
                  {index < filteredTransactions.length - 1 && <Separator />}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <Dialog
          open={!!selectedTransaction}
          onOpenChange={() => setSelectedTransaction(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-medium">{selectedTransaction.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Amount:</span>
                <span
                  className={`font-semibold ${
                    selectedTransaction.amount >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {selectedTransaction.amount >= 0 ? "+" : "-"}
                  {formatNaira(Math.abs(selectedTransaction.amount))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                {selectedTransaction.payment_status && (
                  <Badge
                    className={getStatusColor(
                      selectedTransaction.payment_status
                    )}
                  >
                    {selectedTransaction.payment_status}
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {selectedTransaction.created_at
                    ? formatTransactionDate(selectedTransaction.created_at)
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Reference:</span>
                <span className="font-medium">
                  {selectedTransaction.reference}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium">
                  {selectedTransaction.payment_gateway || "N/A"}
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedTransaction(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
