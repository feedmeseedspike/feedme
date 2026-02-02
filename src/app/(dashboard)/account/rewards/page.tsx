import { createClient } from "@utils/supabase/server";
import RewardsClient from "./RewardsClient";
import RewardsOverview from "./RewardsOverview";

import { redirect } from "next/navigation";

export default async function RewardsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  // Handle unauthenticated state gracefully to prevent layout crashes
  if (!user) {
    // We return empty data and handle the redirect in the client component
    // or simply show an empty state.
    // The previous server-side redirect might have conflicted with the layout.
    return (
        <div className="container mx-auto py-12 px-6">
             <RewardsClient vouchers={[]} />
        </div>
    );
    // Ideally we could allow RewardsOverview to handle "guest" state too
  }

  // Fetch Profile for Loyalty Points
  const { data: profile } = await supabase
    .from('profiles')
    .select('loyalty_points')
    .eq('user_id', user.id)
    .single();

  // Fetch active vouchers for this user
  const { data: vouchers } = await supabase
    .from('vouchers')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const { data: usages } = await supabase
      .from('voucher_usages')
      .select('voucher_id')
      .eq('user_id', user.id);

  const usedVoucherIds = new Set(usages?.map(u => u.voucher_id) || []);

  const availableVouchers = vouchers?.filter(v => !usedVoucherIds.has(v.id)).map(v => ({
      ...v,
      is_used: false
  })) || [];

  return (
    <div className="container mx-auto py-12 px-6">
      <div className="mb-12">
        <h1 className="text-4xl font-black mb-2 font-quicksand text-gray-900 leading-tight">Member Perks</h1>
        <p className="text-gray-500 text-sm">Track your loyalty points and active order bonuses.</p>
      </div>

      <div className="space-y-16">
        <RewardsOverview loyaltyPoints={profile?.loyalty_points || 0} />

        <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#1B6013] mb-2 flex items-center gap-2">
                <div className="w-6 h-1 bg-[#1B6013] rounded-full" />
                Active Order Bonuses
            </h4>
            <RewardsClient vouchers={availableVouchers} />
        </div>
      </div>
    </div>
  );
}
