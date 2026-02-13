"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@components/ui/button';
import { Separator } from '@components/ui/separator';
import { X, Wallet, Gift, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from 'src/hooks/useUser';
import { useWalletBalanceQuery } from 'src/queries/wallet';
import { formatNaira } from 'src/lib/utils';

export default function DealsPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [popupType, setPopupType] = useState<'welcome' | 'cashback' | null>(null);
  const pathname = usePathname();
  const { user } = useUser();
  const userId = user?.user_id;

  const {
    data: walletBalance,
    isLoading: isLoadingBalance,
  } = useWalletBalanceQuery(userId || "");

  useEffect(() => {
    // 1. Route Check: Don't show on auth or admin pages
    const hiddenRoutes = ['/login', '/signup', '/register', '/auth', '/checkout', '/admin', '/order-confirmation'];
    if (hiddenRoutes.some(route => pathname?.includes(route))) {
        return;
    }

    // 2. Cooldown Check (3 days)
    const lastShown = localStorage.getItem('feedme_deals_popup_last_shown');
    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;

    if (lastShown && (now - parseInt(lastShown)) < threeDays) {
        return;
    }

    // 3. Determine Popup Type
    const timer = setTimeout(() => {
        if (userId && walletBalance > 0) {
            setPopupType('cashback');
            setIsOpen(true);
            localStorage.setItem('feedme_deals_popup_last_shown', now.toString());
        } else if (!userId) {
            // Unauthenticated user -> Welcome / 5% off
            setPopupType('welcome');
            setIsOpen(true);
            localStorage.setItem('feedme_deals_popup_last_shown', now.toString());
        }
    }, 8000); // 8 second delay for organic appearance

    return () => clearTimeout(timer);
  }, [pathname, userId, walletBalance]);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && popupType && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-[400px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto border border-slate-100"
          >
            <button 
              onClick={handleClose}
              className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-full transition-colors z-20"
            >
              <X className="w-4 h-4" />
            </button>

            {popupType === 'cashback' ? (
              /* --- CASHBACK REMINDER VERSION --- */
              <div className="p-8 pt-10 text-center">
                <motion.div 
                  initial={{ rotate: -10, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  className="w-48 h-48 mx-auto mb-2 overflow-hidden flex items-center justify-center translate-y-[-20px]"
                >
                  <img 
                    src="/cashback-wallet.png" 
                    alt="Wallet Balance" 
                    className="w-full h-full object-contain"
                  />
                </motion.div>
                
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 mt-[-20px]">Wallet Reminder</p>
                <h2 className="text-3xl font-black text-slate-900 leading-tight mb-4">
                    You have <span className="text-[#1B6013]">{formatNaira(walletBalance)}</span> waiting!
                </h2>
                
                <p className="text-slate-500 text-sm leading-relaxed mb-8 px-4">
                    Your cashback balance is ready to be used. Apply it at checkout to save on your next fresh grocery order.
                </p>

                <div className="space-y-3">
                    <Link href="/checkout" onClick={handleClose}>
                        <Button className="w-full h-14 bg-[#1B6013] hover:bg-[#154a0f] text-white rounded-2xl font-bold text-base shadow-xl shadow-green-900/10 flex items-center justify-center gap-2">
                           Shop & Use Balance <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                    <button onClick={handleClose} className="w-full py-2 text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-slate-600 transition-colors">
                        Maybe Later
                    </button>
                </div>
              </div>
            ) : (
              /* --- WELCOME / 5% OFF VERSION --- */
              <div className="relative">
                {/* Visual Header */}
                <div className="h-48 bg-[#1B6013] relative overflow-hidden flex items-center justify-center">
                    <img 
                      src="/welcome-gift.png" 
                      alt="Welcome Gift" 
                      className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
                    />
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="relative z-10 w-40 h-40"
                    >
                        <img 
                          src="/welcome-gift.png" 
                          alt="FeedMe Gift" 
                          className="w-full h-full object-contain drop-shadow-2xl"
                        />
                    </motion.div>
                </div>

                <div className="p-8 text-center -mt-6 relative z-10 bg-white rounded-t-3xl">
                    <div className="inline-block px-4 py-1.5 bg-[#A3E635] text-[#1B6013] rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                        New Member Gift
                    </div>
                    
                    <h2 className="text-4xl font-black text-slate-900 leading-none mb-2">5% OFF</h2>
                    <p className="text-lg font-bold text-[#1B6013] mb-6">Your First Fresh Order</p>
                    
                    <p className="text-slate-500 text-sm leading-relaxed mb-8">
                        Join FeedMe today for 5% OFF your first order! Plus, as a member, you&apos;ll unlock 10% cashback on all future orders over ₦25,000.
                    </p>

                    <Link href="/register" onClick={handleClose}>
                        <Button className="w-full h-14 bg-[#1B6013] hover:bg-[#154a0f] text-white rounded-2xl font-bold text-base shadow-xl shadow-green-900/10 transition-all active:scale-95">
                           Claim My Discount
                        </Button>
                    </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
