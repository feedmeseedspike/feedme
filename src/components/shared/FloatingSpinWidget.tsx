"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from "framer-motion";
import { Gift, X } from "lucide-react";
import SpinWheel from "./SpinWheel";
import { getSpinPrizes } from "@/lib/actions/prize.actions";
import { SPIN_PRIZES_CONFIG } from "@/lib/deals";
import { useUser } from "src/hooks/useUser";
import { createClient } from "src/utils/supabase/client";

export default function FloatingSpinWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [prizes, setPrizes] = useState<any[]>(SPIN_PRIZES_CONFIG);
  const [isEligible, setIsEligible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const { user } = useUser();

  // Draggable position state
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const constraintsRef = useRef(null);

  // Auto-open after payment
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check URL parameter
    const params = new URLSearchParams(window.location.search);
    const autoSpin = params.get('autoSpin') === 'true';
    
    // Check localStorage flag
    const triggerSpin = localStorage.getItem('triggerSpin') === 'true';

    if ((autoSpin || triggerSpin) && isEligible && !isLoading) {
      // Small delay for better UX
      setTimeout(() => {
        setIsOpen(true);
        // Clear flags
        localStorage.removeItem('triggerSpin');
        // Remove URL parameter without reload
        if (autoSpin) {
          const url = new URL(window.location.href);
          url.searchParams.delete('autoSpin');
          window.history.replaceState({}, '', url);
        }
      }, 1000);
    }
  }, [isEligible, isLoading]);

  // Check eligibility (user must have at least one delivered order)
  useEffect(() => {
    async function checkEligibility() {
      if (!user) {
        setIsEligible(false);
        setIsLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { count } = await supabase
          .from("orders")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", user.user_id)
          .in("payment_status", ["Paid"])
          .in("status", ["Confirmed", "Processing", "order delivered"]);

        // Check if user has already used their welcome spin
        const { data: profile } = await supabase
          .from('profiles')
          .select('has_used_new_user_spin')
          .eq('user_id', user.user_id)
          .single();

        // Eligible if:
        // 1. Has paid orders (Existing user logic)
        // 2. Has 0 orders BUT hasn't used their welcome spin yet (New user logic)
        setIsEligible((count ?? 0) > 0 || !profile?.has_used_new_user_spin);
      } catch (error) {
        console.error("Failed to check spin eligibility:", error);
        setIsEligible(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkEligibility();
  }, [user]);

  // Handle Tooltip visibility
  useEffect(() => {
    if (isEligible && !isLoading) {
      const timer = setTimeout(() => setShowTooltip(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isEligible, isLoading]);

  // Load prizes from database
  useEffect(() => {
    async function loadPrizes() {
      try {
        const dbPrizes = await getSpinPrizes();
        if (dbPrizes && dbPrizes.length > 0) {
          // Map DB prizes to the Expected UI format
          const mappedPrizes = dbPrizes.map(p => ({
            id: p.id,
            label: p.label,
            value: p.value,
            type: p.type as any,
            image: p.image_url || p.product?.images?.[0],
            color: { bg: p.color_bg || '#FFFFFF', text: p.color_text || '#000000' },
            sub: p.sub_label || '',
            probability: p.probability || 0,
            product: p.product
          }));

          // Ensure we have at least 2 "Try Again" slots for balance
          const fails = mappedPrizes.filter(p => p.type === 'none');
          const rewards = mappedPrizes.filter(p => p.type !== 'none');
          
          let failPrizes = [...fails];
          if (failPrizes.length < 2) {
             const defaults = SPIN_PRIZES_CONFIG.filter(p => p.type === 'none').map(p => ({
                id: p.id,
                label: p.label,
                value: p.value,
                type: p.type as any,
                image: p.image || "",
                color: p.color,
                sub: p.sub,
                probability: p.probability,
                product: undefined
             }));
             failPrizes = [...failPrizes, ...defaults.slice(0, 2 - failPrizes.length)];
          }

          // Interleave rewards and fails to keep them separate
          const final: any[] = [];
          const totalSlots = rewards.length + failPrizes.length;
          const failInterval = Math.floor(totalSlots / failPrizes.length);
          
          let failIdx = 0;
          let rewardIdx = 0;
          
          for (let i = 0; i < totalSlots; i++) {
             if (i % failInterval === 0 && failIdx < failPrizes.length) {
                final.push(failPrizes[failIdx++]);
             } else if (rewardIdx < rewards.length) {
                final.push(rewards[rewardIdx++]);
             } else {
                final.push(failPrizes[failIdx++]);
             }
          }

          setPrizes(final.filter(Boolean) as any[]);
        }
      } catch (error) {
        console.error("Failed to load prizes:", error);
      }
    }

    loadPrizes();
  }, []);

  // Handle manual trigger event
  useEffect(() => {
    const handleManualTrigger = () => {
      if (!user) {
        console.log("Spin trigger ignored: User not logged in");
        return;
      }
      console.log("Spin the Wheel: Manual trigger detected");
      setIsLoading(false);
      setIsEligible(true);
      setIsOpen(true);
    };

    window.addEventListener('trigger-spin-wheel', handleManualTrigger);
    return () => window.removeEventListener('trigger-spin-wheel', handleManualTrigger);
  }, [user]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Floating Draggable Button - Only show if eligible and NOT open */}
      <AnimatePresence>
        {(!isOpen && isEligible && !isLoading) && (
          <motion.div
            ref={constraintsRef}
            className="fixed inset-0 pointer-events-none z-[90]"
          >
            <motion.button
              drag
              dragConstraints={constraintsRef}
              dragElastic={0.1}
              dragMomentum={false}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ x: window.innerWidth - 100, y: window.innerHeight / 2 - 50 }}
              style={{ x, y }}
              onClick={() => setIsOpen(true)}
              className="pointer-events-auto absolute w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#1B6013] to-[#15803d] shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing group overflow-hidden"
            >
              {/* Pulsing ring animation */}
              <motion.div
                className="absolute inset-0 rounded-full bg-[#1B6013]"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Tooltip for new users */}
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    className="absolute bottom-full right-0 mb-4 w-48 p-3 bg-[#1B6013] text-white rounded-xl shadow-2xl pointer-events-none"
                  >
                    <div className="absolute bottom-[-6px] right-6 w-3 h-3 bg-[#1B6013] rotate-45" />
                    <p className="text-[10px] font-black uppercase tracking-widest leading-tight text-center">
                      New? Spin to win 10% Off your first order! 🎁
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icon Animation */}
              <motion.div
                animate={{ 
                    y: [0, -5, 0],
                    scale: showTooltip ? [1, 1.1, 1] : 1 
                }}
                transition={{ 
                    y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                    scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                }}
                className="relative z-10"
              >
                <Gift className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-lg" />
              </motion.div>

              {/* Badge */}
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white">
                !
              </div>

              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
            onClick={() => setIsOpen(false)}
          >
            {/* Transparent Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl flex flex-col items-center justify-center"
            >
                {/* Close button - Top Right of the screen area */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute -top-16 right-0 md:-right-8 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all active:scale-90"
                >
                  <X className="w-8 h-8" />
                </button>

                {/* Content - Just the Wheel */}
                <div className="relative flex flex-col items-center mt-12">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", damping: 15, stiffness: 100, delay: 0.1 }}
                      className="w-full flex items-center justify-center"
                    >
                       <SpinWheel prizes={prizes} />
                    </motion.div>
                    
                    {/* <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      transition={{ delay: 0.6 }}
                      className="text-white font-black uppercase tracking-[0.5em] text-[11px] md:text-sm text-center"
                    >
                      Tap the center to spin
                    </motion.p> */}
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
