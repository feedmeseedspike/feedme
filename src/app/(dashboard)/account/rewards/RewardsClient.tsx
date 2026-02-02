"use client";

import React from "react";
import { Copy, Ticket } from "lucide-react";
import { useToast } from "src/hooks/useToast";
import { Button } from "src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "src/components/ui/card";
import { formatNaira } from "src/lib/utils";
import Link from "next/link";
import { cn } from "src/lib/utils";
import { Icon } from "@iconify/react";
import { useEffect } from "react";
import { useUser } from "src/hooks/useUser";
import { useRouter } from "next/navigation";

interface Voucher {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  name: string;
  description?: string;
  valid_to?: string;
  min_order_amount?: number;
}

export default function RewardsClient({ vouchers }: { vouchers: Voucher[] }) {
  const { showToast } = useToast();
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
        // Redirect to login if not authenticated
        router.push('/login?callbackUrl=/account/rewards');
    }
  }, [user, isLoading, router]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast("Code copied to clipboard!", "success");
  };

  if (!vouchers || vouchers.length === 0) {
    return (
      <div className="relative group overflow-hidden rounded-2xl bg-white border border-gray-100 p-16 text-center shadow-sm transition-all">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-green-50 rounded-full blur-3xl opacity-50 -mt-32 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#1B6013] to-[#2a8b1f] flex items-center justify-center mb-8 shadow-sm transition-transform group-hover:scale-105">
            <Ticket className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter mb-4">
            No Rewards Active
          </h3>
          <p className="text-gray-400 max-w-sm font-medium leading-relaxed mb-10">
            You haven&apos;t earned any rewards yet. Start shopping or try your luck on the Spin Wheel to unlock exclusive discounts and prizes!
          </p>
          
          <Button 
            onClick={() => window.dispatchEvent(new Event("trigger-spin-wheel"))}
            className="bg-[#1B6013] hover:bg-[#14480e] text-white h-14 px-10 rounded-xl font-bold uppercase tracking-widest text-xs shadow-sm transition-all hover:scale-105 active:scale-95 flex gap-4"
          >
            <Icon icon="solar:wheel-bold" className="w-5 h-5" />
            Launch Spin Wheel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vouchers.map((voucher) => (
        <div key={voucher.id} className="group relative">
           <Card className="relative h-full overflow-hidden border border-gray-100 shadow-sm rounded-2xl bg-white transition-all duration-300 group-hover:-translate-y-1 group-hover:border-green-200">
            <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12">
                <Ticket className="w-24 h-24" />
            </div>

            <CardHeader className="pt-8 pb-4 px-6 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                 <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                    voucher.code.includes("FREE-DELIV") 
                        ? "bg-orange-50 border-orange-100 text-orange-500" 
                        : "bg-green-50 border-green-100 text-[#1B6013]"
                 )}>
                    <Icon icon={voucher.code.includes("FREE-DELIV") ? "solar:delivery-bold" : "solar:ticket-bold"} className="w-5 h-5" />
                 </div>
                 <div className="h-px flex-1 bg-gray-100 rounded-full" />
              </div>
              
              <CardTitle className="text-xl font-black text-gray-900 uppercase italic tracking-tighter leading-tight">
                {voucher.name}
              </CardTitle>
              <CardDescription className="text-gray-400 text-sm font-medium line-clamp-2">
                {voucher.description || "Active order bonus unlocked via FeedMe rewards."}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-8 relative z-10">
              <div className="space-y-6">
                {/* Code Display - Visual Ticket Feel */}
                <div className="relative overflow-hidden rounded-xl bg-gray-50 p-4 border border-gray-200 transition-colors group-hover:border-[#1B6013]/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-0.5">Voucher Code</p>
                            <code className="text-lg font-mono font-black text-gray-900 tracking-widest uppercase">
                                {voucher.code}
                            </code>
                        </div>
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => copyToClipboard(voucher.code)}
                            className="h-10 w-10 rounded-lg bg-white shadow-sm border border-gray-100 hover:text-[#1B6013] transition-colors"
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Details Table */}
                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <p className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-0.5">Value</p>
                        <p className="text-xs font-black text-[#1B6013]">
                             {voucher.discount_type === 'percentage' 
                                ? `${voucher.discount_value}% OFF` 
                                : formatNaira(voucher.discount_value) + " OFF"}
                        </p>
                   </div>
                   <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <p className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-0.5">Expires</p>
                        <p className="text-xs font-black text-gray-900">
                             {voucher.valid_to ? new Date(voucher.valid_to).toLocaleDateString() : "Never"}
                        </p>
                   </div>
                </div>

                <div className="pt-2">
                    <Button 
                        asChild
                        className="w-full h-12 bg-gray-900 hover:bg-[#1B6013] text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-sm transition-all duration-300"
                    >
                        <Link href={`/checkout?apply_voucher=${voucher.code}`}>
                            Apply at Checkout
                        </Link>
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
