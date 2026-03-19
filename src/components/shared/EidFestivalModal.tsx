"use client";

import {
  Dialog,
  DialogContent,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { X, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCallback } from "react";
import { motion } from "framer-motion";

interface EidFestivalModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
}

export function EidFestivalModal({ isOpen, onClose, isLoggedIn = false }: EidFestivalModalProps) {
  const router = useRouter();

  const handleAction = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('feedme_eid_shown', 'true');
    }
    onClose();
    router.push('/discounted');
  }, [onClose, router]);

  const handleClose = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('feedme_eid_dismissed', Date.now().toString());
    }
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[90vw] md:w-full max-w-sm md:max-w-3xl p-0 overflow-hidden bg-white border-none shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] rounded-2xl font-proxima [&>button]:hidden z-50">
        <div className="flex flex-col md:flex-row relative">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 z-50 p-2 rounded-full bg-black/10 hover:bg-black/20 text-stone-600 transition-all"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Left: Image Section */}
          <div className="relative h-56 md:h-[420px] w-full md:w-5/12 overflow-hidden border-r border-stone-50">
            <Image 
              src="/images/eid-family.jfif" 
              alt="Eid Celebration Family" 
              fill
              className="absolute inset-0 w-full h-full object-cover"
              priority
            />
          </div>

          {/* Right: Content Section */}
          <div className="flex flex-col p-6 md:p-10 w-full md:w-7/12 bg-white justify-center">
            <div className="space-y-5 text-center md:text-left">
              <div className="space-y-1.5">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-block px-3 py-1 bg-[#1B6013]/5 rounded-full border border-[#1B6013]/10"
                >
                  <p className="text-[#1B6013] font-black text-[9px] tracking-[0.2em] uppercase flex items-center gap-1.5 justify-center md:justify-start">
                    RAMADAN SPECIAL <span className="text-sm leading-none">🌙</span>
                  </p>
                </motion.div>
                
                <h2 className="text-[#1B6013] text-4xl md:text-5xl font-black leading-none tracking-tighter">
                  5% OFF
                </h2>
                <p className="text-[#D4AF37] text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] font-serif italic">
                  Your Orders This Week
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-stone-500 text-[12px] md:text-sm leading-relaxed px-2 md:px-0">
                   Celebrate the season with fresh food at better prices. 
                  <span className="block mt-1 font-medium text-stone-600">Enjoy 5% OFF on your orders for a limited time.</span>
                </p>
              </div>

              {/* CTA Button */}
              <div className="pt-2">
                <Button
                  onClick={handleAction}
                  className="w-full bg-[#1B6013] hover:bg-[#154a0f] text-white rounded-xl py-7 text-xs font-black tracking-widest uppercase transition-all duration-500 shadow-xl flex items-center justify-center gap-3 group"
                >
                  <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Shop Massive Discounts
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EidFestivalModal;
