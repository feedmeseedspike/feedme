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
import { DEFAULT_DECEMBER_DEALS } from "src/lib/deals";

import { 
  Check, 
  ChefHat, 
  Truck, 
  MapPin, 
  Copy, 
  ArrowRight,
  ShoppingBag,
  Leaf
} from "lucide-react";
import Image from "next/image";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table";

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
           return true; // Stop polling on error
        }

        setOrder(data);
        setLoading(false);

        // Check if we should stop polling
        const isTerminalState = ["Paid", "Failed", "Declined", "Cancelled"].includes(data.payment_status);
        if (isTerminalState) {
           if (data.payment_status === "Paid") {
              if (!showConfetti) setShowConfetti(true);
              if (!localStorage.getItem(`toast_shown_${id}`)) {
                showToast("Order confirmed!", "success");
                localStorage.setItem(`toast_shown_${id}`, "true");
              }
           }
           return true; // Stop polling
        }
        
        return false; // Continue polling
      } catch (err) {
        console.error(err);
        setError("Failed to load order");
        setLoading(false);
        return true; // Stop polling on error
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
  
  // Cashback Calculation
  const jollyDeal = DEFAULT_DECEMBER_DEALS.JOLLY_CASHBACK;
  const cashbackAmount = (order.user_id && subtotal >= jollyDeal.min_spend) 
      ? subtotal * jollyDeal.percentage 
      : 0;

  // Confetti Logic
  const confettiPieces = Array.from({ length: 30 });

  // Payment status logic (Restored from original)
  let paymentStatusLabel = "Unknown";
  let paymentStatusColor = "bg-gray-400 text-white";
  if (order.payment_status === "Paid") {
    paymentStatusLabel = "Paid";
    paymentStatusColor = "bg-green-600 text-white";
  } else if (
    ["Pending", "Processing", "Awaiting Payment"].includes(order.payment_status)
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
    <div className={`min-h-screen bg-[#FAFAF9] overflow-hidden relative selection:bg-[#A3E635] selection:text-[#1B6013] ${inter.className}`}>
      
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
                {i % 3 === 0 ? (
                  <Leaf className="w-4 h-4 text-[#A3E635]" fill="currentColor" />
                ) : (
                  <div 
                    className={`w-2 h-2 rounded-full ${i % 2 === 0 ? 'bg-[#1B6013]' : 'bg-[#D4AF37]'}`} 
                  />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center relative z-10">
        
        {/* STAGE 1: THE STAMP */}
        <motion.div
          initial={{ scale: 2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="mb-12 relative"
        >
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#1B6013] flex items-center justify-center relative bg-[#FAFAF9] z-20">
            <Check className="w-16 h-16 md:w-20 md:h-20 text-[#1B6013]" strokeWidth={3} />
          </div>
          {/* Ripple Effect */}
          <motion.div
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            className="absolute inset-0 rounded-full bg-[#A3E635] -z-10"
          />
        </motion.div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`${playfair.className} text-4xl md:text-5xl text-[#1B6013] mb-2 text-center`}
        >
          Your order is completed!
        </motion.h1>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[#4B5563] text-lg mb-8 text-center max-w-md"
        >
          Thank you, {order.profiles?.display_name || (order.shipping_address as any)?.email || "Guest"}.<br/>
          Your order has been received.
        </motion.p>

        {/* CASHBACK CELEBRATION */}
        {cashbackAmount > 0 && order.payment_status === "Paid" && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="mb-10 text-center bg-[#F0FDF4] border border-[#1B6013]/20 p-6 rounded-2xl max-w-md mx-auto relative overflow-hidden"
          >
             <div className="relative z-10">
                <span className="text-3xl mb-2 block">🎉</span>
                <h3 className={`${playfair.className} text-xl font-bold text-[#1B6013] mb-1`}>
                   You earned Cashback!
                </h3>
                <p className="text-[#1B6013]">
                   <span className="font-bold">{formatNaira(cashbackAmount)}</span> has been added to your wallet.
                </p>
             </div>
             {/* Background Decoration */}
             <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-[#A3E635] rounded-full opacity-20 blur-2xl" />
             <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-[#1B6013] rounded-full opacity-10 blur-xl" />
          </motion.div>
        )}

        {/* Payment Status Message (Restored) */}
        {paymentStatusLabel !== "Paid" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-12 text-center text-red-600 text-sm max-w-md"
          >
            {paymentStatusLabel === "Failed"
              ? "Your payment was not successful. Please try again or contact support."
              : paymentStatusLabel === "Pending"
                ? "Your payment is still processing. If you have any issues, please contact support."
                : null}
          </motion.div>
        )}


        {/* STAGE 3: THE KITCHEN (Timeline) - Visual enhancement of status */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-2xl mb-16"
        >
          <div className="relative">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-[#E5E7EB] -translate-y-1/2 z-0" />
            
            <div className="flex justify-between relative z-10 w-full px-2 md:px-8">
              {/* Steps */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1B6013] text-white flex items-center justify-center shadow-lg ring-4 ring-[#FAFAF9]">
                  <Check className="w-5 h-5" />
                </div>
                <span className={`font-medium text-sm md:text-base text-[#1B6013]`}>Confirmed</span>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-[#A3E635] text-[#1B6013] flex items-center justify-center shadow-lg ring-4 ring-[#FAFAF9]">
                  <ChefHat className="w-5 h-5" />
                </div>
                <span className="text-gray-500 text-sm md:text-base">Prepping</span>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center ring-4 ring-[#FAFAF9]">
                  <Truck className="w-5 h-5" />
                </div>
                <span className="text-gray-400 text-sm md:text-base">En Route</span>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center ring-4 ring-[#FAFAF9]">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-gray-400 text-sm md:text-base">Delivered</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* STAGE 2: THE RECEIPT (Detailed) */}
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
          className={`w-full max-w-lg bg-white shadow-2xl relative overflow-hidden mb-16 mx-auto group perspective ${spaceMono.className}`}
        >
          {/* Jagged Top Edge */}
          <div className="absolute top-0 left-0 w-full h-4 -mt-3 z-10 pointer-events-none">
             <svg className="w-full h-full text-[#FAFAF9] fill-current" preserveAspectRatio="none" viewBox="0 0 100 10">
               <polygon points="0,10 5,0 10,10 15,0 20,10 25,0 30,10 35,0 40,10 45,0 50,10 55,0 60,10 65,0 70,10 75,0 80,10 85,0 90,10 95,0 100,10 100,0 0,0" />
             </svg>
          </div>

          <div className="p-8 pt-12 pb-12 font-mono text-sm text-[#374151]">
            <div className="text-center mb-8 border-b-2 border-dashed border-gray-200 pb-6">
              <h2 className={`${playfair.className} text-2xl font-bold text-[#1B6013] mb-1`}>FEEDME</h2>
              <p className="text-xs text-gray-400 uppercase tracking-widest">Official Store</p>
              <div className="mt-4 flex flex-col gap-1 items-center">
                 <p className="text-xs">ORDER ID: {orderId}</p>
                 <p className="text-xs text-gray-500">PAYMENT: {order.payment_method}</p>
              </div>
              <p className="mt-2 text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()} — {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>

            <div className="space-y-4 mb-8">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                     <span className="text-gray-900 font-bold block mb-1">
                       {item.products?.name || item.bundles?.name || "Unknown Item"}
                     </span>
                     {item.option && (
                        <span className="text-xs text-gray-500 block">
                            {item.option.name || Object.values(item.option).join(' ')}
                        </span>
                     )}
                     <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-medium whitespace-nowrap">
                    {formatNaira(
                      (item.option?.price ?? item.price ?? 0) * item.quantity
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-dashed border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal</span>
                <span>{formatNaira(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Delivery Fee</span>
                <span>{formatNaira(deliveryFee)}</span>
              </div>
              {voucherDiscount > 0 && (
                 <div className="flex justify-between text-xs text-[#1B6013]">
                  <span>Voucher Discount</span>
                  <span>-{formatNaira(voucherDiscount)}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between items-center text-lg font-bold text-[#1B6013]">
              <span>TOTAL</span>
              <span className="relative z-10">
                {formatNaira(totalAmountPaid)}
                <svg className="absolute -top-3 -left-3 w-[140%] h-[160%] pointer-events-none text-[#A3E635] opacity-50" viewBox="0 0 100 50">
                   <path d="M10,25 Q30,5 50,25 T90,25" fill="none" stroke="currentColor" strokeWidth="2" />
                   <path d="M10,25 Q30,45 50,25 T90,25" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
            </div>
            
            <div className="mt-8 text-center">
              <span className={`inline-block px-4 py-1 rounded-full text-xs font-semibold ${paymentStatusColor}`}>
                {paymentStatusLabel}
              </span>
            </div>
          </div>

          {/* Jagged Bottom Edge */}
          <div className="absolute bottom-0 left-0 w-full h-4 z-10 pointer-events-none rotate-180 mb-[-1px]">
             <svg className="w-full h-full text-[#FAFAF9] fill-current" preserveAspectRatio="none" viewBox="0 0 100 10">
               <polygon points="0,10 5,0 10,10 15,0 20,10 25,0 30,10 35,0 40,10 45,0 50,10 55,0 60,10 65,0 70,10 75,0 80,10 85,0 90,10 95,0 100,10 100,0 0,0" />
             </svg>
          </div>
        </motion.div>

        {/* STAGE 4: THE REWARD - Removed hardcoded 'Give 1000' text if not sure, but keeping simple Referral link if user has one, or removing completely if 'anyhow text' was the issue. 
            User complaint was specific to 'anyhow text'. 'Give 1000 Get 2000' is specific business logic.
            If I don't see it in the DB types, I should remove it to be safe.
            Scanning previous files: referrals table exists. But discount amounts might vary.
            Safest bet: Remove the 'Give X Get Y' hardcoded card and just leave a generic 'Share & Earn' or remove it if user wants STRICT adherence to previous content but with new design.
            The user said "check what we have before". The previous file (step 18) had NO referral section.
            I will REMOVE the referral section to comply with "check what we have before".
        */}
        
        {/* FOOTER ACTIONS */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 1.4 }}
           className="flex flex-col md:flex-row gap-4 w-full justify-center"
        >
          <Link href="/account/order" className="w-full md:w-auto">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full md:w-auto group flex items-center justify-center gap-2 px-8 py-4 bg-white border border-[#1B6013] text-[#1B6013] rounded-full hover:shadow-lg transition-all font-medium"
            >
              <ShoppingBag size={18} />
              <span>View My Orders</span>
            </motion.button>
          </Link>
          
          <Link href="/" className="w-full md:w-auto">
            <motion.button 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               className="w-full md:w-auto group flex items-center justify-center gap-2 px-8 py-4 bg-[#1B6013] text-white rounded-full hover:shadow-lg hover:bg-[#14510f] transition-all font-medium"
            >
              <span>Continue Shopping</span>
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </motion.button>
          </Link>
        </motion.div>

      </main>
    </div>
  );
}
