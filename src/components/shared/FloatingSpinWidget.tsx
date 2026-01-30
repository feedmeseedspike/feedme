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

  // Check eligibility (user must have at least one delivered order or be a new user)
  useEffect(() => {
    async function checkEligibility() {
      // If no user, we can still show a teaser or just hide it.
      // The USER wants visibility, so let's show it but the spin will require auth.
      if (!user) {
        setIsEligible(true); // Show as guest teaser
        setIsLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        
        // We always show the widget for logged in users.
        // The backend handleSpin action will handle the actual logic and outcomes.
        setIsEligible(true);
      } catch (error) {
        console.error("Failed to check spin eligibility:", error);
        setIsEligible(true); // Fallback to show
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
    
    // Register global close helper for navigation from within SpinWheel
    (window as any).__closeSpinWheel = () => setIsOpen(false);

    return () => {
      window.removeEventListener('trigger-spin-wheel', handleManualTrigger);
      delete (window as any).__closeSpinWheel;
    };
  }, [user]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Floating Prize Widget - Positioned above WhatsApp */}
      <AnimatePresence>
        {(!isOpen && isEligible && !isLoading) && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: 1,
              y: [0, -6, 0],
              rotate: [0, -1, 1, 0]
            }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ 
              x: { type: "spring", stiffness: 260, damping: 20 },
              y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className="fixed bottom-[150px] md:bottom-[80px] right-4 z-[90]"
          >
            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(true)}
              className="relative w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#1B6013] to-[#15803d] shadow-[0_10px_25px_-5px_rgba(27,96,19,0.4),0_8px_10px_-6px_rgba(27,96,19,0.4)] flex items-center justify-center group overflow-hidden border-2 border-white/20"
            >
              {/* Golden Glow Effect */}
              <motion.div
                className="absolute inset-0 bg-yellow-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"
                animate={{
                   scale: [1, 1.2, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              {/* Pulsing ring animation */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-[#1B6013]"
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.3, 0, 0.3],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Tooltip for new users */}
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, x: 20, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 10, scale: 0.95 }}
                    className="absolute right-full mr-4 top-1/2 -translate-y-1/2 w-48 p-3 bg-[#1B6013] text-white rounded-2xl shadow-2xl pointer-events-none border border-white/10"
                  >
                    <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-[#1B6013] rotate-45 border-r border-t border-white/10" />
                    <p className="text-[10px] font-bold uppercase tracking-widest leading-tight text-center">
                      {user ? (
                        <>Spin to win <span className="text-yellow-400">Prizes</span>! 🎁</>
                      ) : (
                        <>Sign in to <span className="text-yellow-400">SPIN</span>! 🎡</>
                      )}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icon Animation */}
              <motion.div
                animate={{ 
                    rotate: [0, -10, 10, 0],
                    y: [0, -2, 2, 0]
                }}
                transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                }}
                className="relative z-10"
              >
                <Gift className="w-7 h-7 md:w-8 md:h-8 text-white drop-shadow-lg" />
              </motion.div>

              {/* Badge */}
              <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_8px_#facc15]" />

              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4"
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
