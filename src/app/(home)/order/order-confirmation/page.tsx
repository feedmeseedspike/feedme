"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Playfair_Display, Space_Mono, Inter } from "next/font/google";
import { clearCart } from "src/store/features/cartSlice";
import { useClearCartMutation } from "@/queries/cart";
import { formatNaira, showToast } from "src/lib/utils";
import { Separator } from "@components/ui/separator";
import { 
  BONUS_CONFIG, 
  calculatePotentialCashBack, 
  calculateLoyaltyPoints 
} from "src/lib/deals";
import { getCustomerOrdersAction } from "src/lib/actions/user.action";

import { 
  Check, 
  ChefHat, 
  Truck, 
  MapPin, 
  Copy, 
  ArrowRight,
  ShoppingBag,
  Leaf,
  Settings2,
  X,
  ShoppingBasket
} from "lucide-react";
import Image from "next/image";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";
import FloatingSpinWidget from "@components/shared/FloatingSpinWidget";
import SpinWheel from "@components/shared/SpinWheel";

// Fonts
const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"]
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"]
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans"
});
export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const urlOrderId = searchParams.get("orderId");
  
  const [orderId, setOrderId] = useState<string | undefined>(urlOrderId || undefined);
  const [missingOrderId, setMissingOrderId] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rewardSummary, setRewardSummary] = useState<any>(null);
  const [spinNotifVisible, setSpinNotifVisible] = useState(false);
  
  const dispatch = useDispatch();
  const clearCartMutation = useClearCartMutation();

  // --- Logic from original file ---
  async function clearData() {
    try {
      await clearCartMutation.mutateAsync();
    } catch (e) {
      console.error("Failed to clear server cart", e);
    }
  }

  useEffect(() => {
    // Initial cleanup
    clearData();
  }, []);

  useEffect(() => {
    let id = orderId;
    // Cleanup local storage
    if (typeof window !== "undefined") {
      localStorage.removeItem("voucherCode");
      localStorage.removeItem("voucherDiscount");
      localStorage.removeItem("cart"); // Fallback text clear
      dispatch(clearCart());
      
      if (!id) {
        id = localStorage.getItem("lastOrderId") || undefined;
        if (id) localStorage.removeItem("lastOrderId");
      }
    }

    if (!id) {
      setMissingOrderId(true);
      setLoading(false);
      return;
    }

    setOrderId(id);
    setLoading(true);

    // Fetch order with polling
    let intervalId: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 20; // Poll for 1 minute (20 * 3s)

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        
        if (data.error) {
           setError(data.error);
           setLoading(false);
           return true; 
        }

        setOrder(data);
        
        // Calculate items and subtotal for rewards
        const orderItems = data.order_items || [];
        const orderSubtotal = orderItems.reduce((acc: number, item: any) => {
          const price = (item.option?.price ?? item.price) || 0;
          return acc + price * item.quantity;
        }, 0);

        // Always set reward summary for UI feedback, even if payment is pending
        const rewards = {
            freeDelivery: orderSubtotal >= BONUS_CONFIG.SUBSEQUENT_FREE_DELIVERY.min_spend,
            cashback: data.user_id ? calculatePotentialCashBack(orderSubtotal) : 0,
            tierPoints: data.user_id ? calculateLoyaltyPoints(orderSubtotal) : 0,
        };
        setRewardSummary(rewards);

        if (data.payment_status === "Paid" || data.payment_status === "paid") {
           setSpinNotifVisible(true);
           
           // Automatically trigger the wheel
           if (!localStorage.getItem(`spin_triggered_${id}`)) {
              setTimeout(() => {
                 window.dispatchEvent(new CustomEvent('trigger-spin-wheel'));
                 localStorage.setItem(`spin_triggered_${id}`, "true");
              }, 2500); 
           }
        }

        setLoading(false);

        // Check if we should stop polling
        const isTerminalState = ["Paid", "paid", "Failed", "failed", "Declined", "Cancelled"].includes(data.payment_status);
        if (isTerminalState) {
            if (data.payment_status === "Paid" || data.payment_status === "paid") {
               if (!showConfetti) setShowConfetti(true);
               if (!localStorage.getItem(`toast_shown_${id}`)) {
                showToast("Order confirmed!", "success");
                localStorage.setItem(`toast_shown_${id}`, "true");
              }
           }
           return true; 
        }
        
        return false; 
      } catch (err) {
        console.error(err);
        setError("Failed to load order");
        setLoading(false);
        return true;
      }
    };

    // Initial fetch
    fetchOrder().then(shouldStop => {
       if (!shouldStop) {
          intervalId = setInterval(async () => {
             attempts++;
             if (attempts >= maxAttempts) {
               clearInterval(intervalId);
               return;
             }
             const stop = await fetchOrder();
             if (stop) clearInterval(intervalId);
          }, 3000);
       }
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [urlOrderId, dispatch]); 

  const copyReferralCode = () => {
    // Only attempt if order exists
    if (!order) return;
    const code = `FEEDME-${order?.user_id?.substring(0, 6).toUpperCase() || "FRIEND"}`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast("Referral code copied!", "success");
  };

  // Loading State
  if (loading) {
    return (
      <div className={`min-h-screen bg-[#FAFAF9] flex items-center justify-center text-[#1B6013] ${playfair.className}`}>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Leaf className="w-12 h-12" />
        </motion.div>
        <span className="ml-4 text-xl tracking-wider">Preparing Receipt...</span>
      </div>
    );
  }

  // Error State
  if (missingOrderId || error) {
    return (
      <div className={`min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center p-8 text-[#1F2937] ${inter.className}`}>
        <h1 className={`${playfair.className} text-3xl mb-4 text-red-800`}>Order Not Found</h1>
        <p className="mb-8 text-gray-600">
          {error || "We could not verify your order. Please contact support."}
        </p>
        <Link href="/">
          <button className="px-8 py-3 bg-[#1B6013] text-white rounded-full hover:bg-[#14510f] transition-all">
            Return Home
          </button>
        </Link>
      </div>
    );
  }

  // --- Calculations ---
  const items: any[] = order.order_items || [];
  const subtotal = items.reduce((acc: number, item: any) => {
    const itemPrice =
      (item.option?.price !== undefined && item.option?.price !== null
        ? item.option.price
        : item.price) || 0;
    return acc + itemPrice * item.quantity;
  }, 0);

  const deliveryFee = order.delivery_fee ?? 0;
  const voucherDiscount = order.voucher_discount ?? 0; 
  const totalAmountPaid = order.total_amount_paid || (subtotal + deliveryFee - voucherDiscount);
  

  // Confetti Logic
  const confettiPieces = Array.from({ length: 30 });

  // Payment status logic (Restored from original)
  let paymentStatusLabel = "Unknown";
  let paymentStatusColor = "bg-gray-400 text-white";
  if (order.payment_status === "Paid" || order.payment_status === "paid") {
    paymentStatusLabel = "Paid";
    paymentStatusColor = "bg-green-600 text-white";
  } else if (
    ["Pending", "pending", "Processing", "Awaiting Payment"].includes(order.payment_status)
  ) {
    paymentStatusLabel = "Pending";
    paymentStatusColor = "bg-yellow-500 text-white";
  } else if (
    ["Failed", "Declined", "Cancelled", "Error"].includes(order.payment_status)
  ) {
    paymentStatusLabel = "Failed";
    paymentStatusColor = "bg-red-600 text-white";
  } else if (order.payment_status) {
    paymentStatusLabel = order.payment_status;
    paymentStatusColor = "bg-gray-400 text-white";
  }

  return (
    <div className={`min-h-screen bg-white selection:bg-[#ecfccb] selection:text-[#1B6013] ${inter.className}`}>
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden overflow-x-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#f7a838]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#1B6013]/5 rounded-full blur-[120px]" />
      </div>

      {/* Confetti Overlay */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {confettiPieces.map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  y: -20, 
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
                  opacity: 1, 
                  rotate: 0 
                }}
                animate={{ 
                  y: typeof window !== 'undefined' ? window.innerHeight + 100 : 1000, 
                  rotate: Math.random() * 360,
                  opacity: 0
                }}
                transition={{ 
                  duration: Math.random() * 3 + 4, 
                  delay: Math.random() * 2,
                  ease: "easeOut"
                }}
                className="absolute"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${i % 2 === 0 ? 'bg-[#1B6013]' : 'bg-[#A3E635]'}`} />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24 relative z-10">
        {/* Success Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-full bg-[#f0fdf4] flex items-center justify-center mb-8 relative"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-12 h-12 rounded-full bg-[#1B6013] flex items-center justify-center text-white"
            >
              <Check className="w-6 h-6" strokeWidth={3} />
            </motion.div>
            {/* Soft pulse */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-[#1B6013]/10"
            />
          </motion.div>

          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`${playfair.className} text-4xl md:text-5xl text-[#111827] font-bold mb-4`}
          >
            Order Confirmed
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-500 text-lg"
          >
            Thank you, {order.profiles?.display_name || "Jerry"}. We&apos;ve sent a confirmation to your email.
          </motion.p>
        </div>

        {/* Order Status Timeline (Evolved) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white border border-slate-100 p-8 rounded-xl mb-12 shadow-sm"
        >
          <div className="flex justify-between items-start">
             <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-[#1B6013] mb-2 ring-4 ring-[#1B6013]/10" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#1B6013]">Confirmed</span>
             </div>
             <div className="flex-1 h-px bg-slate-100 mt-2" />
             <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-slate-100 mb-2" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Processing</span>
             </div>
             <div className="flex-1 h-px bg-slate-100 mt-2" />
             <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-slate-100 mb-2" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Shipped</span>
             </div>
             <div className="flex-1 h-px bg-slate-100 mt-2" />
             <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-slate-100 mb-2" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Delivered</span>
             </div>
          </div>
        </motion.div>

        {/* Rewards Section (Clean & Premium) */}
        {rewardSummary && (rewardSummary.freeDelivery || rewardSummary.cashback > 0 || rewardSummary.tierPoints > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-12"
          >
            <div className="bg-[#1B6013] rounded-xl p-8 text-white relative overflow-hidden group shadow-xl">
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#A3E635]">
                        Order Benefits
                    </span>
                  </div>
                  
                  <h3 className={`${playfair.className} text-3xl mb-8`}>Rewards earned with this order ✨</h3>

                  <div className="flex flex-wrap gap-8 mb-10">
                     {rewardSummary.freeDelivery && (
                        <div className="flex flex-col">
                           <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1">Next Order</span>
                           <span className="text-xl font-black">Free Delivery</span>
                        </div>
                     )}
                     {rewardSummary.cashback > 0 && (
                        <div className="flex flex-col border-l border-white/10 pl-8 first:border-0 first:pl-0">
                           <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1">Cashback Reward</span>
                           <span className="text-xl font-black">{formatNaira(rewardSummary.cashback)}</span>
                        </div>
                     )}
                     {rewardSummary.tierPoints > 0 && (
                        <div className="flex flex-col border-l border-white/10 pl-8 first:border-0 first:pl-0">
                           <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1">Loyalty Points</span>
                           <span className="text-xl font-black">+{rewardSummary.tierPoints}</span>
                        </div>
                     )}
                  </div>

                  {spinNotifVisible && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.dispatchEvent(new CustomEvent('trigger-spin-wheel'))}
                      className="inline-flex items-center gap-3 py-4 px-8 bg-[#A3E635] text-[#1B6013] rounded-xl font-black text-sm uppercase tracking-tight shadow-lg shadow-black/10"
                    >
                      <span>Claim Your Free Spin</span>
                      <ArrowRight className="w-4 h-4" strokeWidth={3} />
                    </motion.button>
                  )}
               </div>
            </div>
          </motion.div>
        )}

        {/* Order Details Accordion/List (Minimalist) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white border border-slate-100 rounded-xl overflow-hidden"
        >
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
             <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Order Number</p>
                <h4 className="font-bold text-gray-900"># {orderId?.substring(0, 8).toUpperCase()}</h4>
             </div>
             <button 
                onClick={() => {
                   navigator.clipboard.writeText(orderId || "");
                   showToast("Order ID copied", "success");
                }}
                className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400"
             >
                <Copy className="w-4 h-4" />
             </button>
          </div>

          <div className="p-8 space-y-6">
             {items.map((item, idx) => (
                <div key={idx} className="flex gap-4">
                   <div className="w-16 h-16 bg-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden border border-slate-50">
                      { ((item as any).products?.images?.[0] || (item as any).bundles?.thumbnail_url || (item as any).offers?.image_url) ? (
                         <Image 
                            src={(item as any).products?.images?.[0] || (item as any).bundles?.thumbnail_url || (item as any).offers?.image_url} 
                            alt={(item as any).products?.name || (item as any).bundles?.name || (item as any).offers?.title || "Item"} 
                            fill 
                            className="object-cover" 
                         />
                      ) : (
                         <ShoppingBag className="w-6 h-6 text-slate-300" />
                      )}
                   </div>
                   <div className="flex-1 flex justify-between items-start">
                      <div className="space-y-0.5">
                         <h5 className="font-bold text-slate-900 leading-tight">
                            {(item as any).products?.name || (item as any).bundles?.name || (item as any).offers?.title || "Item"}
                         </h5>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quantity: {item.quantity}</p>
                      </div>
                      <span className="font-black text-slate-900 text-sm tabular-nums">
                         {formatNaira(((item as any).option?.price ?? item.price ?? 0) * item.quantity)}
                      </span>
                   </div>
                </div>
             ))}
          </div>

          <div className="bg-gray-50/50 p-8 space-y-3">
             <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900 font-medium">{formatNaira(subtotal)}</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery</span>
                <span className="text-gray-900 font-medium">{formatNaira(deliveryFee)}</span>
             </div>
             {voucherDiscount > 0 && (
                <div className="flex justify-between text-sm text-[#1B6013]">
                   <span>Discount</span>
                   <span className="font-medium">-{formatNaira(voucherDiscount)}</span>
                </div>
             )}
             <Separator className="bg-gray-100 my-4" />
             <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-900 text-sm md:text-lg">Total Paid</span>
                <span className="text-[#1B6013] text-sm md:text-lg">{formatNaira(totalAmountPaid)}</span>
             </div>
          </div>
        </motion.div>

        {/* Referral / Incentive (Subtle) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="w-full max-w-lg mx-auto text-center mb-12 py-6 border-y border-gray-100 flex flex-col items-center gap-2"
        >
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Share the love</p>
          <p className="text-gray-600 text-sm">
            Refer a friend and get <strong className="text-gray-900">₦2,000 off</strong> your next purchase!
          </p>
          <button 
            onClick={copyReferralCode}
            className="mt-2 group flex items-center gap-2 text-[#1B6013] font-bold text-xs uppercase tracking-tighter"
          >
            <span>{copied ? "Copied!" : "Copy My Referral Code"}</span>
            <Copy className="w-3 h-3 group-hover:scale-110 transition-transform" />
          </button>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 1.1 }}
           className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/">
             <button className="w-full sm:w-auto px-10 py-5 bg-[#1B6013] text-white rounded-full font-bold text-sm transition-all hover:bg-[#155e10] hover:shadow-[0_20px_40px_rgba(27,96,19,0.15)] active:scale-95">
                Continue Shopping
             </button>
          </Link>
          <Link href="/account/order">
             <button className="w-full sm:w-auto px-10 py-5 bg-white border border-gray-100 text-gray-500 rounded-full font-bold text-sm transition-all hover:bg-gray-50 active:scale-95">
                View My Orders
             </button>
          </Link>
        </motion.div>
      </main>
      <FloatingSpinWidget />
    </div>
  );
}
