"use client";

import React from "react";
import { formatNaira } from "src/lib/utils";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

const MILESTONES = [
  { threshold: 50000, label: "Free Delivery", type: "gift", desc: "For your next order" },
  { threshold: 100000, label: "₦2,000 Cashback", type: "cashback", desc: "Credit for next order" },
  { threshold: 200000, label: "1 Loyalty Point", type: "point", desc: "Climb the ranks" },
  { threshold: 500000, label: "2 Loyalty Points", type: "point", desc: "Elite status" },
  { threshold: 1000000, label: "3 Loyalty Points", type: "point", desc: "VIP status" },
];

export default function RewardsOverview({ loyaltyPoints = 0 }) {
  // Find current level based on points
  let level = "Bronze";
  let nextLevel = "Silver";
  let target = 3;
  
  if (loyaltyPoints >= 10) {
      level = "Platinum";
      nextLevel = "Crown";
      target = 20;
  } else if (loyaltyPoints >= 5) {
      level = "Gold";
      nextLevel = "Platinum";
      target = 10;
  } else if (loyaltyPoints >= 3) {
      level = "Silver";
      nextLevel = "Gold";
      target = 5;
  }

  const levelProgress = Math.min(100, (loyaltyPoints / target) * 100);

  return (
    <div className="space-y-8">
      {/* Loyalty Status Card */}
      <div className="bg-gradient-to-br from-[#1B6013] to-[#2a8b1f] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-green-900/10">
        <div className="absolute top-0 right-0 p-8 opacity-10">
            <Icon icon="solar:crown-minimalistic-bold-duotone" className="w-40 h-40 rotate-12" />
        </div>
        
        <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                    <Icon icon="solar:star-rainbow-bold-duotone" className="w-8 h-8 text-yellow-400" />
                </div>
                <div>
                    <h2 className="text-[10px] uppercase font-black tracking-[0.2em] text-white/60">Current Status</h2>
                    <h3 className="text-3xl font-black font-quicksand leading-tight">{level} Member</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-white/80 uppercase tracking-widest">{loyaltyPoints} / {target} Points</span>
                        <span className="text-[10px] font-black uppercase text-yellow-400">Next: {nextLevel}</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden border border-white/10">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${levelProgress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]"
                        />
                    </div>
                </div>
                
                <div className="flex gap-4">
                    <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                        <div className="text-2xl font-black mb-1">₦2,000</div>
                        <p className="text-[8px] uppercase font-bold text-white/50 tracking-wider">Per 100k Order</p>
                    </div>
                    <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
                        <div className="text-2xl font-black mb-1">FREE</div>
                        <p className="text-[8px] uppercase font-bold text-white/50 tracking-wider">Spin with Order</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Rewards Protocol Table */}
      <div className="grid grid-cols-1 gap-4">
        <h4 className="text-xs font-black uppercase tracking-widest text-[#1B6013] mb-2 flex items-center gap-2">
            <div className="w-6 h-1 bg-[#1B6013] rounded-full" />
            V1.0 Rewards Protocol
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MILESTONES.map((m, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-lg transition-all border-b-4 border-b-gray-50 active:scale-[0.98] group">
                    <div className="flex items-start justify-between mb-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                            m.type === 'gift' ? 'bg-blue-50 text-blue-600' :
                            m.type === 'cashback' ? 'bg-orange-50 text-orange-600' :
                            'bg-purple-50 text-purple-600'
                        }`}>
                            <Icon icon={
                                m.type === 'gift' ? 'solar:box-minimalistic-bold-duotone' :
                                m.type === 'cashback' ? 'solar:wad-of-money-bold-duotone' :
                                'solar:medal-star-bold-duotone'
                            } className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Threshold</p>
                            <p className="text-sm font-black text-[#1B6013]">{formatNaira(m.threshold)}</p>
                        </div>
                    </div>
                    <h5 className="font-black text-gray-900 group-hover:text-[#1B6013] transition-colors">{m.label}</h5>
                    <p className="text-xs text-gray-400 font-medium">{m.desc}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
