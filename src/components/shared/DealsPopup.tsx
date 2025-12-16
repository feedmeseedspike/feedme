"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@components/ui/button';
import { X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DealsPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // 1. Route Check: Don't show on auth or admin pages as requested
    const hiddenRoutes = ['/login', '/signup', '/register', '/auth', '/checkout', '/admin'];
    if (hiddenRoutes.some(route => pathname?.includes(route))) {
        return;
    }

    // 2. Session Check
    const hasSeenPopup = sessionStorage.getItem('hasSeenDealsPopup');
    if (hasSeenPopup) return;

    // 3. Delay: Wait 5 seconds to ensure page is "fully loaded" before showing
    const timer = setTimeout(() => setIsOpen(true), 5000);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('hasSeenDealsPopup', 'true');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm md:max-w-md bg-[#1B6013] rounded-3xl shadow-2xl overflow-hidden pointer-events-auto border border-[#A3E635]/30"
            style={{
                backgroundImage: "url('/jolly_modal_bg.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
          >
             {/* Dark overlay for readability */}
             <div className="absolute inset-0 bg-gradient-to-b from-[#1B6013]/80 to-[#0e330a]/95" />

            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 p-8 pb-10 text-center text-white">
                <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    transition={{ delay: 0.2, type: "spring" }}
                    className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/10 backdrop-blur-md mb-6 border border-[#A3E635]/50 shadow-[0_0_20px_rgba(163,230,53,0.3)] overflow-hidden"
                >
                    <img 
                      src="/cashback_icon.png" 
                      alt="Cashback" 
                      className="w-full h-full object-cover"
                    />
                </motion.div>

                <h2 className="text-3xl font-bold mb-2 tracking-tight font-serif text-[#A3E635] drop-shadow-md">
                   Earn while you shop
                </h2>
                
                <div className="my-8 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner">
                    <div className="text-5xl font-bold mb-2 text-white drop-shadow-md">10%</div>
                    <div className="text-xl font-bold text-[#A3E635] uppercase tracking-wide mb-1">Jolly Cash Back</div>
                    <p className="text-white/80 text-sm font-medium">On all orders above ₦25,000</p>
                </div>

                <Link href="/" onClick={handleClose} className="block w-full pointer-events-auto">
                    <Button className="w-full h-12 rounded-xl bg-white text-[#1B6013] hover:bg-[#A3E635] hover:text-[#1B6013] font-bold text-lg shadow-lg border-2 border-transparent hover:border-white transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                        Start Shopping
                    </Button>
                </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
