"use client";

import React from "react";
import { Copy, Ticket } from "lucide-react";
import { useToast } from "src/hooks/useToast";
import { Button } from "src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "src/components/ui/card";
import { formatNaira } from "src/lib/utils";
import Link from "next/link";

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

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast("Code copied to clipboard!", "success");
  };

  if (!vouchers || vouchers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
        <Ticket className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-bold text-gray-700 font-quicksand">No Rewards Yet</h3>
        <p className="text-gray-500 max-w-md mx-auto mt-2 mb-6">
          Participate in promotions to earn special rewards and discounts!
        </p>
        {/* SPIN TO WIN - TEMPORARILY DISABLED */}
        {/* <Link href="/spin-to-win">
          <Button className="bg-[#f7a838] hover:bg-[#e0962d] text-white">
            Go Spin & Win
          </Button>
        </Link> */}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vouchers.map((voucher) => (
        <Card key={voucher.id} className="relative overflow-hidden border-dash-array transition-all hover:shadow-md">
          <div className="absolute top-0 left-0 w-2 h-full bg-[#f7a838]" />
          <CardHeader className="pb-3 pl-6">
            <CardTitle className="flex justify-between items-start font-quicksand text-xl">
              <span>{voucher.name}</span>
            </CardTitle>
            <CardDescription>
              {voucher.description || "Special reward just for you."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-6">
            <div className="flex flex-col gap-4">
              <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-between border border-dashed border-slate-200">
                <code className="text-lg font-mono font-bold text-slate-700 tracking-wider">
                  {voucher.code}
                </code>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => copyToClipboard(voucher.code)}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-col gap-1 text-sm text-slate-500">
                <div className="flex justify-between">
                  <span>Value:</span>
                  <span className="font-bold text-slate-700">
                    {voucher.discount_type === 'percentage' 
                      ? `${voucher.discount_value}% OFF` 
                      : formatNaira(voucher.discount_value) + " OFF"}
                  </span>
                </div>
                {voucher.min_order_amount && (
                  <div className="flex justify-between">
                    <span>Min. Spend:</span>
                    <span>{formatNaira(voucher.min_order_amount)}</span>
                  </div>
                )}
                {voucher.valid_to && (
                  <div className="flex justify-between text-xs">
                    <span>Expires:</span>
                    <span>{new Date(voucher.valid_to).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                 <Link href={`/checkout?apply_voucher=${voucher.code}`}>
                    <Button className="w-full bg-[#1B6013] hover:bg-[#14480e] text-white">
                        Use Now
                    </Button>
                 </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
