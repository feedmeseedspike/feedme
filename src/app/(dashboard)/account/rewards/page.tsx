import { createClient } from "@utils/supabase/server";
import RewardsClient from "./RewardsClient";

export default async function RewardsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in to view rewards.</div>;
  }

  // Fetch active vouchers for this user
  const { data: vouchers, error } = await supabase
    .from('vouchers')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // Filter out used ones manually if needed, though API checks usage table.
  // Ideally, we join with voucher_usages, but for now let's just list the vouchers.
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
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 font-quicksand">My Rewards</h1>
      <RewardsClient vouchers={availableVouchers} />
    </div>
  );
}
