"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Phone, ShoppingCart } from "lucide-react";
import AddToCart from "./add-to-cart";

interface StickyAddToCartProps {
  product: any;
  selectedOptionData: any;
  isVisible: boolean;
}

export default function StickyAddToCart({
  product,
  selectedOptionData,
  isVisible
}: StickyAddToCartProps) {
  useEffect(() => {
    // Only apply on mobile
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
          className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-gray-100 md:hidden p-3 flex items-center gap-3"
          style={{ height: 'auto' }}
        >
          {/* Home Link */}
          <Link 
            href="/"
            className="w-14 h-14 flex items-center justify-center rounded-xl border border-[#1B6013] text-[#1B6013] hover:bg-green-50 transition-colors shrink-0"
          >
            <Home className="w-6 h-6" />
          </Link>

          {/* Call Link */}
          <a 
            href="tel:+2348088282487"
            className="w-14 h-14 flex items-center justify-center rounded-xl border border-[#1B6013] text-[#1B6013] hover:bg-green-50 transition-colors shrink-0"
          >
            <Phone className="w-6 h-6" />
          </a>

          {/* Full Width Add To Cart Button */}
          <div className="flex-1 h-14 relative">
             <AddToCart
                sticky
                className="!static !w-full !h-full !rounded-xl !bg-[#1B6013] !text-white !shadow-none !px-0 !border-none !py-0 flex items-center justify-center font-bold text-lg"
                item={{
                  id: product._id || "",
                  name: product.name,
                  slug: product.slug,
                  category: product.category,
                  price: selectedOptionData?.price ?? product.price,
                  images: product.images,
                  options: product.options,
                  option: selectedOptionData,
                  selectedOption: selectedOptionData?.name,
                  in_season: product.in_season,
                }}
             />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
