"use client";

import React, { useState } from "react";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";
import { formatNaira, cn } from "src/lib/utils";
import PaginationBar from "@components/shared/pagination";
import { Tables } from "src/utils/database.types";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";

// --- Types ---
interface WalletClientProps {
  user: any;
  walletBalance: number;
  transactions: Tables<"transactions">[];
  totalTransactions: number;
  currentPage: number;
  pageSize: number;
}

// --- Components ---

const AuroraBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
    <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-[#1B6013]/5 rounded-full blur-[120px] mix-blend-multiply animate-pulse-slow" />
    <div className="absolute bottom-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-[#1B6013]/10 rounded-full blur-[100px] mix-blend-multiply animate-pulse-slower" />
    <div className="absolute top-[30%] left-[30%] w-[40vw] h-[40vw] bg-[#e8f5e9] rounded-full blur-[80px] mix-blend-multiply" />
  </div>
);

const GlassCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    className={cn(
      "relative overflow-hidden rounded-[32px] border border-white/60 bg-white/60 backdrop-blur-xl shadow-sm",
      className
    )}
  >
    {children}
  </motion.div>
);

const TransactionItem = ({ tx }: { tx: Tables<"transactions"> }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.8)" }}
    transition={{ duration: 0.2 }}
    className="group flex items-center justify-between p-4 mb-2 rounded-2xl cursor-default transition-colors hover:shadow-sm"
  >
    <div className="flex items-center gap-5">
      <div
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-white shadow-sm border border-gray-100",
          tx.amount >= 0 ? "text-[#1B6013]" : "text-gray-400"
        )}
      >
        {tx.amount >= 0 ? (
          <ArrowDownLeft className="w-5 h-5" strokeWidth={1.5} />
        ) : (
          <ArrowUpRight className="w-5 h-5" strokeWidth={1.5} />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[15px] font-medium text-gray-900 leading-none">
          {tx.description || "Transaction"}
        </span>
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
{tx.created_at && (
            <>
              <span>
                {new Date(tx.created_at).toLocaleDateString(undefined, {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>
                {new Date(tx.created_at).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </>
          )}
        </div>
      </div>
    </div>

    <div className="text-right">
      <span
        className={cn(
          "block text-[15px] font-semibold tracking-tight",
          tx.amount >= 0 ? "text-[#1B6013]" : "text-gray-900"
        )}
      >
        {tx.amount >= 0 ? "+" : ""}
        {formatNaira(tx.amount)}
      </span>
      <span
        className={cn(
          "text-[10px] uppercase tracking-wider font-semibold",
          tx.payment_status === "Paid" || tx.payment_status === "paid"
            ? "text-emerald-600"
            : tx.payment_status === "Pending" || tx.payment_status === "pending"
            ? "text-amber-600"
            : "text-gray-400"
        )}
      >
        {tx.payment_status}
      </span>
    </div>
  </motion.div>
);

// --- Main Page ---

export default function WalletClient({
  user,
  walletBalance,
  transactions,
  totalTransactions,
  currentPage,
  pageSize,
}: WalletClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [fundingAmount, setFundingAmount] = useState("");
  const [fundingLoading, setFundingLoading] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  // Filter transactions
  const filteredTransactions = (transactions || []).filter((transaction) => {
    const description = transaction.description || "";
    return description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(totalTransactions / pageSize);

  const handleAddFunds = async () => {
    setFundingLoading(true);
    try {
      const res = await axios.post("/api/wallet/initialize", {
        email: user.email,
        amount: parseFloat(fundingAmount),
        type: "wallet_funding",
        customerName: user.display_name,
      });
      if (res.data.authorization_url) {
        const paymentUrl = res.data.authorization_url;

        // Google Tag conversion event
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'conversion_event_purchase_2', {
            'event_callback': function() {
              window.location.href = paymentUrl;
            },
            'event_timeout': 2000,
          });
        } else {
          window.location.href = paymentUrl;
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFundingLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#FAFAFA] text-gray-900 font-sans selection:bg-[#1B6013]/20">
      <AuroraBackground />

      <main className="relative z-10 container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-gray-900">
              Wallet
            </h1>
          </div>
        </div>

        {/* Hero: Glass Balance Card */}
        <GlassCard className="p-8 md:p-12 bg-[#1B6013] border-white/10 shadow-xl overflow-hidden relative group">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/10 shadow-sm">
                     <Wallet className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>
                <span className="text-sm font-medium text-white/80 uppercase tracking-wider">Available Balance</span>
              </div>
              
              <div className="flex items-center gap-4">
                <AnimatePresence mode="wait" initial={false}>
                    {showBalance ? (
                        <motion.div
                            key="balance"
                            initial={{ opacity: 0, filter: "blur(4px)" }}
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, filter: "blur(4px)" }}
                            transition={{ duration: 0.3 }}
                            className="flex items-baseline gap-1"
                        >
                            <span className="text-6xl md:text-7xl font-light tracking-tighter text-white">
                                {formatNaira(walletBalance).replace("₦", "")}
                            </span>
                            <span className="text-2xl md:text-3xl text-white/60 font-light translate-y-[-4px]">NGN</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="hidden"
                            initial={{ opacity: 0, filter: "blur(4px)" }}
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, filter: "blur(4px)" }}
                            transition={{ duration: 0.3 }}
                            className="text-6xl md:text-7xl font-light tracking-widest text-white/80 select-none flex items-center h-[1.1em]"
                        >
                            ••••••
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                >
                    {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              onClick={() => setIsAddFundsOpen(true)}
              className="h-14 px-8 rounded-full bg-white text-[#1B6013] hover:bg-gray-100 shadow-lg shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98] text-base font-semibold border-none"
            >
              <Plus className="w-5 h-5 mr-2" /> Add Funds
            </Button>
          </div>
        </GlassCard>

        {/* Transaction Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between sticky top-4 z-20 md:static">
             <h2 className="text-xl font-medium tracking-tight">Activity</h2>
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#1B6013] transition-colors" />
                <input 
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-40 md:w-64 pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-full text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B6013]/10 focus:w-64 md:focus:w-80 transition-all shadow-sm"
                />
             </div>
          </div>

          <div className="relative min-h-[400px]">
            {/* Timeline Line */}
            <div className="absolute left-[27px] top-4 bottom-4 w-px bg-gray-100 hidden md:block" />

            <AnimatePresence mode="wait">
              {filteredTransactions.length > 0 ? (
                <div className="space-y-1">
                   {filteredTransactions.map((tx, i) => (
                      <TransactionItem key={tx.id} tx={tx} />
                   ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-64 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                     <Search className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">No transactions found</p>
                  <p className="text-gray-400 text-sm">Try adjusting your search terms</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            {totalPages > 1 && (
                <div className="mt-8">
                     <PaginationBar page={currentPage} totalPages={totalPages} />
                </div>
            )}
          </div>
        </section>
      </main>

      {/* Add Funds Modal */}
      <Dialog open={isAddFundsOpen} onOpenChange={setIsAddFundsOpen}>
        <DialogContent className="sm:max-w-md bg-white/90 backdrop-blur-xl border-white/20 shadow-2xl rounded-[32px] p-0 overflow-hidden">
             <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <DialogTitle className="text-xl font-semibold text-gray-900">Top Up</DialogTitle>
                        <p className="text-sm text-gray-500">Add funds to your wallet instantly.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-50 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 border border-gray-100">
                         <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Amount</span>
                         <div className="relative flex items-center justify-center w-full">
                            <span className="text-3xl text-gray-300 font-light mr-2">₦</span>
                            <input 
                                autoFocus
                                type="number"
                                placeholder="0"
                                value={fundingAmount}
                                onChange={(e) => setFundingAmount(e.target.value)}
                                className="w-full bg-transparent text-center text-4xl font-medium text-gray-900 placeholder:text-gray-200 outline-none"
                            />
                         </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {[1000, 5000, 10000].map((amt) => (
                            <button
                                key={amt}
                                onClick={() => setFundingAmount(amt.toString())}
                                className="py-3 px-4 rounded-xl bg-white border border-gray-100 shadow-sm text-sm font-medium text-gray-600 hover:border-[#1B6013] hover:text-[#1B6013] hover:shadow-md transition-all active:scale-95"
                            >
                                +{amt.toLocaleString()}
                            </button>
                        ))}
                    </div>
                </div>

                <Button 
                    disabled={!fundingAmount || parseFloat(fundingAmount) <= 0 || fundingLoading}
                    onClick={handleAddFunds}
                    className="w-full h-14 bg-[#1B6013] hover:bg-[#154d0f] text-white rounded-2xl text-lg font-medium shadow-xl shadow-green-900/20 transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
                >
                    {fundingLoading ? (
                        <div className="flex items-center gap-2">
                             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                             Processing...
                        </div>
                    ) : "Pay with Paystack"}
                </Button>
             </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
