"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Playfair_Display, Inter } from "next/font/google";
import { clearCart } from "src/store/features/cartSlice";
import { useClearCartMutation } from "@/queries/cart";
import { showToast } from "src/lib/utils";

import { 
  Check, 
  Copy,
  Gift,
  Leaf
} from "lucide-react";

// Fonts
const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"]
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans"
});

export default function GiftLinkPage() {
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

  const clearData = useCallback(async () => {
    try {
      await clearCartMutation.mutateAsync();
    } catch (e) {
      console.error("Failed to clear server cart", e);
    }
  }, [clearCartMutation]);

  useEffect(() => {
    clearData();
  }, [clearData]);

  const fetchOrder = useCallback(async (idToFetch: string) => {
    try {
      const res = await fetch(`/api/orders/${idToFetch}`);
      const data = await res.json();
      
      if (data.error) {
         setError(data.error);
         setLoading(false);
         return true; 
      }

      setOrder(data);
      setLoading(false);

      const isTerminalState = ["Paid", "paid", "Failed", "failed", "Declined", "Cancelled"].includes(data.payment_status);
      if (isTerminalState) {
          if (data.payment_status === "Paid" || data.payment_status === "paid") {
             setShowConfetti(true);
             if (!localStorage.getItem(`toast_shown_gift_${idToFetch}`)) {
              showToast("Gift link successfully created!", "success");
              localStorage.setItem(`toast_shown_gift_${idToFetch}`, "true");
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
  }, []);

  useEffect(() => {
    let id = orderId;
    if (typeof window !== "undefined") {
      localStorage.removeItem("voucherCode");
      localStorage.removeItem("voucherDiscount");
      localStorage.removeItem("cart");
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

    let intervalId: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 20;

    fetchOrder(id).then(shouldStop => {
       if (!shouldStop) {
          intervalId = setInterval(async () => {
             attempts++;
             if (attempts >= maxAttempts) {
                clearInterval(intervalId);
                return;
             }
             const currentId = id as string;
             const stop = await fetchOrder(currentId);
             if (stop) clearInterval(intervalId);
          }, 3000);
       }
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderId, dispatch, fetchOrder]); 

  const shareLink = typeof window !== "undefined" ? `${window.location.origin}/gift-claim?o=${orderId}` : "";
  
  const copyShareLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast("Gift link copied!", "success");
  };

  const shareToWhatsApp = () => {
     let sender = "Someone";
     if (order?.shipping_address?.senderName) {
        sender = order.shipping_address.senderName;
     } else if (order?.profiles?.display_name) {
        sender = order.profiles.display_name;
     }

     const message = `🎁 ${sender} bought you a meal from FeedMe! Click the link below to enter your delivery details and claim your gift:\n\n${shareLink}`;
     window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-[#FAFAF9] flex items-center justify-center text-[#1B6013] ${playfair.className}`}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Leaf className="w-12 h-12" />
        </motion.div>
        <span className="ml-4 text-xl tracking-wider">Generating Gift Link...</span>
      </div>
    );
  }

  if (missingOrderId || error) {
    return (
      <div className={`min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center p-8 text-[#1F2937] ${inter.className}`}>
        <h1 className={`${playfair.className} text-3xl mb-4 text-red-800`}>Order Not Found</h1>
        <p className="mb-8 text-gray-600">
          {error || "We could not verify your gift order."}
        </p>
        <Link href="/">
          <button className="px-8 py-3 bg-[#1B6013] text-white rounded-full hover:bg-[#14510f]">
            Return Home
          </button>
        </Link>
      </div>
    );
  }

  const confettiPieces = Array.from({ length: 30 });

  return (
    <div className={`min-h-screen bg-white selection:bg-[#ecfccb] selection:text-[#1B6013] ${inter.className}`}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden overflow-x-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#f7a838]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#1B6013]/5 rounded-full blur-[120px]" />
      </div>

      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {confettiPieces.map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -20, x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), opacity: 1, rotate: 0 }}
                animate={{ y: typeof window !== 'undefined' ? window.innerHeight + 100 : 1000, rotate: Math.random() * 360, opacity: 0 }}
                transition={{ duration: Math.random() * 3 + 4, delay: Math.random() * 2, ease: "easeOut" }}
                className="absolute"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${i % 2 === 0 ? 'bg-[#1B6013]' : 'bg-[#A3E635]'}`} />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24 relative z-10">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mb-8 relative"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-14 h-14 rounded-full bg-[#1B6013] flex items-center justify-center text-white shadow-lg shadow-green-900/20"
            >
              <Gift className="w-6 h-6" strokeWidth={2.5} />
            </motion.div>
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
            Your Gift is Ready!
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-500 text-lg max-w-lg"
          >
            You have successfully purchased this meal. Now, send this link to your friend so they can claim it and pick their delivery location.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white border border-slate-100 p-8 rounded-2xl mb-12 shadow-xl shadow-green-900/5 text-center flex flex-col items-center"
        >
           <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Gift Shareable Link</h3>
           
           <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between mb-8 overflow-hidden group">
               <span className="text-gray-600 font-medium truncate pr-4 text-sm sm:text-base selection:bg-green-100">
                  {shareLink}
               </span>
               <button 
                  onClick={copyShareLink}
                  className="bg-white border border-slate-200 shrink-0 p-3 rounded-xl hover:bg-slate-100 focus:bg-green-50 transition-colors shadow-sm"
                  title="Copy Link"
               >
                  {copied ? <Check className="w-5 h-5 text-[#1B6013]" /> : <Copy className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />}
               </button>
           </div>

           <div className="flex flex-col sm:flex-row gap-4 w-full">
               <button 
                  onClick={shareToWhatsApp}
                  className="flex-1 bg-[#25D366] hover:bg-[#1EBE5C] text-white font-bold py-4 px-6 rounded-xl shadow-md shadow-[#25D366]/20 transition-all active:scale-95 flex items-center justify-center gap-2"
               >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                  </svg>
                  Share to WhatsApp
               </button>
               <button 
                  onClick={copyShareLink}
                  className="flex-1 bg-white border border-[#1B6013]/20 hover:border-[#1B6013] text-[#1B6013] font-bold py-4 px-6 rounded-xl shadow-sm transition-all active:scale-95"
               >
                  {copied ? "Copied!" : "Copy Link"}
               </button>
           </div>
        </motion.div>

        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 1.1 }}
           className="flex justify-center"
        >
          <Link href="/">
             <button className="px-8 py-4 bg-transparent text-gray-500 hover:text-gray-900 font-bold text-sm transition-colors border-b-2 border-transparent hover:border-gray-900">
                Back to Store
             </button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
