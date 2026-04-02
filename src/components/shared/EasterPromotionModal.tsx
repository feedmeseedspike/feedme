"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import Image from "next/image";
import { X, ShoppingCart, Percent } from "lucide-react";
import Link from "next/link";

export default function EasterPromotionModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen this promotion in the current session
    const hasSeenPromo = sessionStorage.getItem("easter_promo_seen");
    
    if (!hasSeenPromo) {
      // Delay before showing modal for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3500); // 3.5 seconds
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("easter_promo_seen", "true");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[92vw] sm:w-fit sm:max-w-[420px] max-h-[90vh] p-0 overflow-hidden border-none rounded-2xl bg-transparent shadow-none [&>button]:hidden flex items-center justify-center">
        <div className="relative inline-block w-full sm:w-auto bg-transparent rounded-2xl shadow-2xl overflow-hidden leading-[0]">
          {/* Clickable Flyer - Standard img tag for maximum reliability in production */}
          <Link 
            href="/discounted" 
            onClick={handleClose}
            className="inline-block relative rounded-2xl transition-all duration-300 hover:brightness-95 active:scale-[0.98]"
          >
            <div className="relative w-full flex items-center justify-center bg-transparent">
              <img
                src="/banners/easter_modal_visual.jpeg" 
                alt="Easter Special 10% Discount - FeedMe"
                className="rounded-2xl w-full h-auto max-h-[85vh] object-contain shadow-2xl shadow-black/20"
                loading="eager"
              />
            </div>
          </Link>
          
          {/* Close Button - Now perfectly pinned to the real flyer edge */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-all z-40 shadow-lg backdrop-blur-md active:scale-90"
            aria-label="Close promotion"
          >
            <X className="w-4 h-4" strokeWidth={3} />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
