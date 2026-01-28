"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "src/hooks/useUser";

export default function SpinNotification() {
  const { user } = useUser();
  
  // Query to check if the user has a recent delivered order
  // Logic: If user has at least one order with status 'order delivered', show the spin notification.
  // In a real scenario, we'd check if they *already* spun for that order (via a join or flag), 
  // but for now, we'll encourage them to spin if they are an active customer.
  const { data: hasEligibleOrder, isLoading } = useQuery({
    queryKey: ["spin-eligibility", user?.user_id],
    queryFn: async () => {
      if (!user) return false;
      const supabase = createClient();
      const { data } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", user.user_id)
        .in("payment_status", ["Paid"])
        .in("status", ["Confirmed", "Processing", "order delivered"])
        .order("created_at", { ascending: false })
        .limit(1);
        
      return data && data.length > 0;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (!user || isLoading || !hasEligibleOrder) return null;

  return (
    <div onClick={() => window.dispatchEvent(new Event("trigger-spin-wheel"))} className="relative group mr-2 cursor-pointer">
      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full shadow-lg border-2 border-white animate-bounce-slow hover:scale-110 transition-transform">
        <span className="text-lg">🎡</span>
      </div>
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
         <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
      </span>
      {/* Tooltipish text */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white text-[#1B6013] text-[10px] font-bold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Spin & Win!
      </div>
    </div>
  );
}
