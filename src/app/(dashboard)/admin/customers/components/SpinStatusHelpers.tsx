"use client";

import { useQuery } from "@tanstack/react-query";
// import { createClient } from "@utils/supabase/client"; // Unused now
import { Loader2, Gift, XCircle, CheckCircle } from "lucide-react";
import { formatNaira } from "@/lib/utils";
import { getCustomerCartPrizesAction, getCustomerLastOrderAction, getCustomerHistoricalPrizesAction } from "@/lib/actions/admin-dashboard.actions";

export function CartItemsList({ customerId }: { customerId: string }) {
  const { data: cartItems, isLoading } = useQuery({
    queryKey: ["admin", "customer-cart", customerId],
    queryFn: async () => {
      return await getCustomerCartPrizesAction(customerId);
    },
  });

  if (isLoading) return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;

  if (!cartItems || cartItems.length === 0) {
    return <p className="text-xs text-gray-500 italic">Cart is empty.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Prize Items */}
      {cartItems.filter((item: any) => item.price === 0).length > 0 && (
        <div>
          <h5 className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-2">Won Prizes</h5>
          <ul className="space-y-2">
            {cartItems.filter((item: any) => item.price === 0).map((item: any) => (
              <li key={item.id} className="flex items-center gap-2 text-sm bg-green-50 p-2 rounded border border-green-100">
                <Gift className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-gray-800">{item.product?.name || "Unknown Item"}</span>
                <span className="text-xs text-green-600 font-bold ml-auto">FREE</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Regular Items */}
      <div>
        <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Cart Items</h5>
        <ul className="space-y-2">
          {cartItems.filter((item: any) => item.price !== 0).map((item: any) => (
            <li key={item.id} className="flex items-center gap-2 text-sm bg-white p-2 rounded shadow-sm border border-gray-100">
              <span className="font-medium text-gray-800">{item.product?.name || "Unknown Item"}</span>
              <span className="text-xs text-gray-400 ml-1">x{item.quantity}</span>
              <span className="text-xs font-bold text-gray-900 ml-auto">{formatNaira(item.price * item.quantity)}</span>
            </li>
          ))}
          {cartItems.filter((item: any) => item.price !== 0).length === 0 && (
             <p className="text-[10px] text-gray-400 italic">No regular items.</p>
          )}
        </ul>
      </div>
    </div>
  );
}

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

export function HistoricalPrizesList({ customerId }: { customerId: string }) {
  const { data: prizes, isLoading } = useQuery({
    queryKey: ["admin", "customer-historical-prizes", customerId],
    queryFn: () => getCustomerHistoricalPrizesAction(customerId),
  });

  if (isLoading) return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;

  if (!prizes || prizes.length === 0) {
    return <p className="text-xs text-gray-500 italic">No historical prizes found.</p>;
  }

  return (
    <ul className="space-y-2">
      {prizes.map((item: any) => (
        <li key={item.id} className="flex flex-col gap-1 text-sm bg-white p-2 rounded shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-600" />
            <span className="font-semibold text-gray-800">{item.product?.name || "Unknown Item"}</span>
            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded ml-auto font-bold">CLAIMED</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-gray-400">
             <span>Ordered on: {new Date(item.order?.created_at).toLocaleDateString()}</span>
             <span className="capitalize">{item.order?.status}</span>
          </div>
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
