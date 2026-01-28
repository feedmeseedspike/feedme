"use client";

import React, { useMemo } from "react";
import { BONUS_CONFIG } from "src/lib/deals";
import { formatNaira } from "src/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";


const MILESTONES = [
  { threshold: 25000, label: "Welcome Spin", type: "spin", isNewUserOnly: true },
  { threshold: 50000, label: "Free Delivery", type: "gift" },
  { threshold: 100000, label: "₦2,000 Cashback", type: "cashback" },
  { threshold: 200000, label: "1 Loyalty Point", type: "point" },
  { threshold: 500000, label: "2 Loyalty Points", type: "point" },
  { threshold: 1000000, label: "3 Loyalty Points", type: "point" },
];

export default function BonusProgressBar({ subtotal, isFirstOrder = false, isAuthenticated = false }: { subtotal: number; isFirstOrder?: boolean; isAuthenticated?: boolean }) {
  // If not authenticated, we show a "preview" of what a First Time user would see
  const showPreview = !isAuthenticated;
  const effectiveIsFirstOrder = showPreview ? true : isFirstOrder;

  // Filter milestones: keep regular ones, and only keep "New User Only" ones if user is first-timer (or previewing)
  const activeMilestones = MILESTONES.filter(m => !m.isNewUserOnly || effectiveIsFirstOrder);
  
  const nextMilestone = activeMilestones.find(m => subtotal < m.threshold) || null;
  const isAllMaxed = subtotal >= activeMilestones[activeMilestones.length - 1].threshold;
  
  const remaining = nextMilestone ? Math.max(0, nextMilestone.threshold - subtotal) : 0;
  const maxThreshold = activeMilestones[activeMilestones.length - 1].threshold;
  const totalPercent = Math.min(100, (subtotal / maxThreshold) * 100);

  // Find all reached milestones
  const reachedMilestones = activeMilestones.filter(m => subtotal >= m.threshold);
  const hasFreeDelivery = subtotal >= 50000;
  // Spin unlock logic: Authenticated users unlock it. Unauthenticated users see it locked.
  const hasUnlockedSpin = isAuthenticated && isFirstOrder && subtotal >= 25000;

  return (
    <div className={`w-full space-y-4 py-1 relative ${!isAuthenticated ? 'opacity-70 select-none' : ''}`}>
      {!isAuthenticated && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-lg border border-dashed border-slate-300">
            <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 flex flex-col items-center text-center max-w-[90%]">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                    <Icon icon="solar:lock-keyhole-bold" className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs font-bold text-slate-800 mb-1">Rewards Locked</p>
                <p className="text-[10px] text-slate-500 mb-3 leading-tight">Log in to track progress & unlock 10% Off!</p>
                <a href="/login" className="bg-[#1B6013] text-white text-[10px] font-bold px-4 py-1.5 rounded-full hover:bg-[#154d0f] transition-colors">
                    Login to Unlock
                </a>
            </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-end justify-between">
        <div className="space-y-0.5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#1B6013]">Rewards Progress</h4>
            <div className="flex items-center gap-1.5 opacity-60">
                <div className="w-1 h-1 rounded-full bg-[#1B6013]" />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Active: {formatNaira(subtotal)}</span>
            </div>
        </div>
        
        {nextMilestone && (
            <div className="text-right">
                <span className="block text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Next Goal</span>
                <span className="text-[9px] font-black text-[#1B6013] uppercase px-2 py-0.5 bg-[#1B6013]/5 rounded-md">{nextMilestone.label}</span>
            </div>
        )}
      </div>

      {/* Main Messaging Area (Minimalist) */}
      <div className="space-y-3">
        {hasUnlockedSpin ? (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 py-1"
            >
                <div className="w-6 h-6 rounded-lg bg-[#1B6013] flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Icon icon="solar:wheel-bold" className="w-3.5 h-3.5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-900 leading-tight uppercase text-[#1B6013]">Welcome Spin Unlocked! 🎡</p>
                    <p className="text-[8px] font-medium text-slate-400">Spin the wheel to reveal your 10% Welcome Gift!</p>
                </div>
            </motion.div>
        ) : hasFreeDelivery ? (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 py-1"
            >
                <div className="w-6 h-6 rounded-lg bg-[#1B6013] flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Icon icon="solar:delivery-bold" className="w-3.5 h-3.5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-900 leading-tight uppercase">Next Order Free Delivery Unlocked!</p>
                    <p className="text-[8px] font-medium text-slate-400">Auto-applied at your next checkout ✨</p>
                </div>
            </motion.div>
        ) : (
            <div className="flex items-center gap-3 py-1">
                <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <Icon icon="solar:gift-bold" className="w-3 h-3" />
                </div>
                <p className="text-[10px] font-medium text-slate-500 leading-tight">
                    Spend <span className="font-black text-slate-900">{formatNaira(remaining)}</span> more for <span className="text-[#1B6013] font-bold uppercase">{nextMilestone?.label}</span>
                </p>
            </div>
        )}

        {/* The Bar */}
        <div className="relative pt-1">
            <div className="relative w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${totalPercent}%` }}
                    className="absolute top-0 left-0 h-full bg-[#1B6013] transition-all duration-700 ease-out"
                />
            </div>
            
            {/* Milestone Dots */}
            <div className="absolute top-0.5 left-0 w-full h-full flex justify-between pointer-events-none px-0.5">
                {activeMilestones.map((m, i) => (
                    <div 
                        key={i} 
                        className={`w-1 h-2 rounded-full transition-colors duration-500 absolute -translate-x-1/2 ${subtotal >= m.threshold ? 'bg-[#1B6013]' : 'bg-slate-200'}`} 
                        style={{ left: `${(m.threshold / maxThreshold) * 100}%` }}
                    />
                ))}
            </div>
        </div>

        {reachedMilestones.length > 0 && !isAllMaxed && (
             <div className="flex flex-wrap gap-2">
                {reachedMilestones.slice(-1).map((m, i) => (
                    <span key={i} className="text-[8px] font-black text-[#1B6013]/70 uppercase tracking-tight flex items-center gap-1">
                        <Icon icon="solar:check-circle-bold" className="w-3 h-3" />
                        {m.label} active
                    </span>
                ))}
             </div>
        )}
      </div>
    </div>
  );
}
