"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@components/ui/button';
import { Separator } from '@components/ui/separator';
import { X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from 'src/hooks/useUser';

export default function DealsPopup() {
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();
  const [isFirstOrder, setIsFirstOrder] = useState(true);

  // Fetch order history to determine first-time status
  useEffect(() => {
    if (user?.user_id) {
        import('src/lib/actions/user.action').then(({ getCustomerOrdersAction }) => {
            getCustomerOrdersAction(user.user_id).then((orders) => {
                const count = orders?.length || 0;
                setOrderCount(count);
                setIsFirstOrder(count === 0);
            });
        });
    } else {
        setIsFirstOrder(true);
    }
  }, [user]);

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
                      src={isFirstOrder ? "/cashback_icon.png" : "https://cdn-icons-png.flaticon.com/512/1152/1152912.png"} 
                      alt="Rewards" 
                      className="w-full h-full object-cover p-4"
                    />
                </motion.div>

                <h2 className={`text-3xl font-bold mb-2 tracking-tight font-serif text-[#A3E635] drop-shadow-md`}>
                   {isFirstOrder ? (user ? "Welcome Bonus!" : "Sign up & Earn!") : "Unlock Rewards!"}
                </h2>
                
                <div className="my-8 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner">
                    {isFirstOrder ? (
                        <>
                            <div className="text-5xl font-black mb-2 text-white drop-shadow-md">10% OFF</div>
                            <div className="text-xl font-bold text-[#A3E635] uppercase tracking-wide mb-1">First Order Discount</div>
                            <p className="text-white/80 text-sm font-medium">
                                On all orders above ₦25,000
                            </p>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#A3E635]" />
                                <span className="text-sm font-bold uppercase tracking-widest">Free Delivery at ₦50,000</span>
                            </div>
                            <Separator className="bg-white/10" />
                            <div className="flex items-center justify-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#A3E635]" />
                                <span className="text-sm font-bold uppercase tracking-widest">₦2,000 Cashback at ₦100,000</span>
                            </div>
                        </div>
                    )}
                </div>

                <Link href={user ? "/" : "/register"} onClick={handleClose} className="block w-full pointer-events-auto">
                    <Button className="w-full h-12 rounded-xl bg-white text-[#1B6013] hover:bg-[#A3E635] hover:text-[#1B6013] font-bold text-lg shadow-lg border-2 border-transparent hover:border-white transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                        {user ? "Start Shopping" : "Register Now"}
                    </Button>
                </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
