"use client";
import React, { useEffect, useState } from "react";
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
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Eye,
  EyeOff,
} from "lucide-react";
import { formatNaira } from "src/lib/utils";
import { Skeleton } from "@components/ui/skeleton";
import PaginationBar from "@components/shared/pagination";
import { Tables } from "src/utils/database.types";
import { createClient } from "@utils/supabase/client";
import axios from "axios";

interface WalletClientProps {
  user: any;
  walletBalance: number;
  transactions: Tables<"transactions">[];
  totalTransactions: number;
  currentPage: number;
  pageSize: number;
}

export default function WalletClient({
  user,
  walletBalance,
  transactions,
  totalTransactions,
  currentPage,
  pageSize,
}: WalletClientProps) {
  const [showBalance, setShowBalance] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Tables<"transactions"> | null>(null);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [addFundsLoading, setAddFundsLoading] = useState(false);
  const [addFundsError, setAddFundsError] = useState<string | null>(null);

  const supabase = createClient();
  console.log(supabase);
  supabase.auth.getSession().then(console.log);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      console.log("Supabase session in WalletClient:", data.session);
    });
  }, []);

  // Filtered transactions
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

  const totalPages = Math.ceil(totalTransactions / pageSize);

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

  const handleAddFunds = async () => {
    setAddFundsLoading(true);
    setAddFundsError(null);
    try {
      console.log('trying...')
      // const {
      //   data: { session },
      // } = await supabase.auth.getSession();
      // const accessToken = session?.access_token;
      // if (!accessToken) {
      //   throw new Error("You are not authenticated. Please log in again.");
      // }
      // console.log("get session => ", accessToken);
      const res = await axios.post(
        "/api/wallet/initialize",
        { email: user.email, amount: parseFloat(amount) },
        // {
        //   headers: {
        //     Authorization: `Bearer ${accessToken}`,
        //   },
        // }
      );
      if (!res.data.authorization_url)
        throw new Error(res.data.message || "Failed to initialize payment");
      window.location.href = res.data.authorization_url;
    } catch (err: any) {
      setAddFundsError(
        err.response?.data?.message || err.message || "Failed to add funds"
      );
    } finally {
      setAddFundsLoading(false);
    }
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
              className="text-white hover:bg-white/20">
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
                {showBalance ? formatNaira(walletBalance) : "••••••"}
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
                      Enter the amount you want to add to your wallet.
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
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddFundsOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-[#1B6013] hover:bg-[#1B6013]/90"
                      disabled={
                        !amount || parseFloat(amount) <= 0 || addFundsLoading
                      }
                      onClick={handleAddFunds}>
                      {addFundsLoading ? "Processing..." : "Continue"}
                    </Button>
                  </DialogFooter>
                  {addFundsError && (
                    <div className="text-red-500 text-sm mt-2">
                      {addFundsError}
                    </div>
                  )}
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
            {filteredTransactions.length === 0 ? (
              <div className="text-center text-gray-500">
                No transactions found.
              </div>
            ) : (
              filteredTransactions.map((transaction, index) => (
                <div key={transaction.id}>
                  <div
                    className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    onClick={() => setSelectedTransaction(transaction)}>
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-full">
                        {getTransactionIcon(transaction.amount)}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          {formatTransactionDate(transaction.created_at || "")}{" "}
                          • {transaction.reference}
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
                              )}>
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
                        }`}>
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
        {/* Add PaginationBar here */}
        {totalPages > 1 && (
          <div className="p-4">
            <PaginationBar page={currentPage} totalPages={totalPages} />
          </div>
        )}
      </Card>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <Dialog
          open={!!selectedTransaction}
          onOpenChange={() => setSelectedTransaction(null)}>
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
                  }`}>
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
                    )}>
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
                onClick={() => setSelectedTransaction(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
