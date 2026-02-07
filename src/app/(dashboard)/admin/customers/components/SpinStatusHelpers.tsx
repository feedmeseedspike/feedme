"use client";

import { useQuery } from "@tanstack/react-query";
// import { createClient } from "@utils/supabase/client"; // Unused now
import { Loader2, Gift, XCircle, CheckCircle } from "lucide-react";
import { formatNaira } from "@/lib/utils";
import { getCustomerCartPrizesAction, getCustomerLastOrderAction } from "@/lib/actions/admin-dashboard.actions";

export function CartPrizesList({ customerId }: { customerId: string }) {
  const { data: cartItems, isLoading } = useQuery({
    queryKey: ["admin", "customer-cart", customerId],
    queryFn: async () => {
      return await getCustomerCartPrizesAction(customerId);
    },
  });

  if (isLoading) return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;

  const prizeItems = cartItems?.filter((item: any) => item.price === 0) || [];

  if (prizeItems.length === 0) {
    return <p className="text-xs text-gray-500 italic">No prize items in cart.</p>;
  }

  return (
    <ul className="space-y-2">
      {prizeItems.map((item: any) => (
        <li key={item.id} className="flex items-center gap-2 text-sm bg-white p-2 rounded shadow-sm border border-indigo-100">
          <Gift className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-gray-800">{item.product?.name || "Unknown Item"}</span>
          <span className="text-xs text-green-600 font-bold ml-auto">FREE</span>
        </li>
      ))}
    </ul>
  );
}

export function SpinEligibilityStatus({ customerId }: { customerId: string }) {
    // Check if last order was completed < 24h ago and spin not used?
    // Current logic: "User must spin after every completed order".
    // We assume if they have a "Delivered" order in the last 7 days, they might be eligible if we check a tracker. 
    // Since we don't have a tracker yet, we'll just show Last Order Time.
    
    const { data: lastOrder } = useQuery({
        queryKey: ["admin", "last-order", customerId],
        queryFn: async () => {
            return await getCustomerLastOrderAction(customerId);
        }
    });

    if (!lastOrder) return <p className="text-xs text-gray-500">No orders found.</p>;

    return (
        <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-700">Last Order:</p>
            <div className="flex items-center justify-between text-xs bg-white p-2 rounded border">
                <span>{new Date(lastOrder.created_at).toLocaleDateString()}</span>
                <span className={`px-2 py-0.5 rounded-full text-white ${lastOrder.status === 'order delivered' ? 'bg-green-500' : 'bg-gray-400'}`}>
                    {lastOrder.status}
                </span>
            </div>
            {lastOrder.status === 'order delivered' && (
                 <p className="text-xs text-green-700 font-bold flex items-center gap-1 mt-1">
                    <CheckCircle className="w-3 h-3" /> Eligible for Spin (if not taken)
                 </p>
            )}
        </div>
    );
}
