"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight } from "lucide-react";
import { formatNaira } from "src/lib/utils";

interface StickyCartCheckoutProps {
  totalAmount: number;
  onCheckout: () => void;
  isVisible: boolean;
}

export default function StickyCartCheckout({
  totalAmount,
  onCheckout,
  isVisible
}: StickyCartCheckoutProps) {
  useEffect(() => {
    const updateHeight = () => {
      if (window.innerWidth < 768 && isVisible) {
        document.documentElement.style.setProperty('--sticky-cart-height', '80px');
      } else {
        document.documentElement.style.setProperty('--sticky-cart-height', '0px');
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    
    return () => {
      window.removeEventListener("resize", updateHeight);
      document.documentElement.style.setProperty('--sticky-cart-height', '0px');
    };
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-gray-100 md:hidden p-3 flex items-center gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]"
        >
          {/* Call Link */}
          <a 
            href="tel:+2348088282487"
            className="w-14 h-14 flex items-center justify-center rounded-xl border border-[#1B6013] text-[#1B6013] hover:bg-green-50 transition-colors shrink-0"
          >
            <Phone className="w-6 h-6" />
          </a>

          {/* Checkout Button */}
          <button
            onClick={onCheckout}
            className="flex-1 h-14 bg-[#1B6013] text-white rounded-xl flex items-center justify-between px-6 font-bold text-lg shadow-lg active:scale-[0.98] transition-all"
          >
            <span>Checkout</span>
            <div className="flex items-center gap-2">
                <span className="opacity-90">{formatNaira(totalAmount)}</span>
                <ArrowRight className="w-5 h-5" />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
