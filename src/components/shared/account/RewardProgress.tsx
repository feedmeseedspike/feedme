"use client";

import React from "react";
import { Progress } from "@components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Gift, TrendingUp, Trophy } from "lucide-react";
import { formatNaira } from "@/lib/utils";
import { Button } from "@components/ui/button";
import Link from "next/link";

interface RewardProgressProps {
  totalSpent: number;
  userName: string;
}

const TIERS = [
  { threshold: 100000, reward: "₦2,000 Cashback", icon: TrendingUp },
  { threshold: 200000, reward: "1 Loyalty Point", icon: Trophy },
  { threshold: 500000, reward: "2 Loyalty Points", icon: Trophy },
  { threshold: 1000000, reward: "3 Loyalty Points", icon: Trophy },
];

export default function RewardProgress({ totalSpent = 0, userName }: RewardProgressProps) {
  // Find next tier
  const nextTier = TIERS.find((t) => t.threshold > totalSpent) || TIERS[TIERS.length - 1];
  const isMaxLevel = totalSpent >= TIERS[TIERS.length - 1].threshold;
  
  // Calculate percentage
  let progress = 0;
  let prevThreshold = 0;
  
  // Find the tier we are currently strictly above
  const currentTierIndex = TIERS.findIndex(t => t.threshold > totalSpent);
  if (currentTierIndex > 0) {
      prevThreshold = TIERS[currentTierIndex - 1].threshold;
  } else if (currentTierIndex === -1 && isMaxLevel) {
      prevThreshold = TIERS[TIERS.length - 2].threshold; // Approximation for max
  }

  const range = nextTier.threshold - prevThreshold;
  const current = totalSpent - prevThreshold;
  
  // Simple 0-100 logic based on absolute max? Or relative to next tier?
  // Let's do relative to next tier for "XP Bar" feel.
  progress = Math.min(100, Math.max(0, (totalSpent / nextTier.threshold) * 100));
  
  // If we want "progress within level":
  // progress = Math.min(100, Math.max(0, (current / range) * 100));
  // But standard "Total Spend" bars usually fill up from 0 to Goal. 
  // Let's stick to "Total Spend / Next Goal".

  const toNext = nextTier.threshold - totalSpent;

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-r from-[#1B6013] to-[#2a8b1f] text-white mb-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Gift className="w-5 h-5 text-yellow-300 animate-bounce" />
                Hello, {userName}!
              </h3>
              <Link href="/account/rewards">
                <Button size="sm" variant="outline" className="h-7 px-3 text-[10px] font-black uppercase tracking-widest bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-lg backdrop-blur-sm">
                   Explore Rewards
                </Button>
              </Link>
            </div>
            <p className="text-sm text-green-100 opacity-90 max-w-md">
              {isMaxLevel 
                ? "You've reached the top tier! You're a VIP Legend!" 
                : `Spend ${formatNaira(toNext)} more to unlock ${nextTier.reward}!`}
            </p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs uppercase tracking-widest opacity-70 font-semibold">Total Spend</p>
            <p className="text-2xl font-black">{formatNaira(totalSpent)}</p>
          </div>
        </div>

        <div className="space-y-2 relative z-10">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider opacity-80">
            <span>₦0</span>
            <span>{formatNaira(nextTier.threshold)}</span>
          </div>
          <Progress value={progress} className="h-3 bg-black/20" indicatorClassName="bg-yellow-400" />
          <div className="flex justify-between items-center mt-2">
             <p className="text-xs font-medium bg-black/20 px-2 py-1 rounded inline-block">
               Current Tier: {currentTierIndex > 0 ? "Level " + currentTierIndex : "Starter"}
             </p>
             {isMaxLevel && (
                 <span className="text-xs font-bold text-yellow-300 flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> Max Status
                 </span>
             )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
