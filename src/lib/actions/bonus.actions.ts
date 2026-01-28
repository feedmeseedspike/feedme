"use server";

import supabaseAdmin from "src/utils/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Retracts bonuses associated with an order if it gets refunded.
 * This should be called during the refund process.
 */
export async function retractOrderBonuses(orderId: string) {
  const supabase = supabaseAdmin;

  // 1. Fetch Order to get user_id and total_amount_paid
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("user_id, total_amount_paid, reference")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    console.error("Order not found during bonus retraction:", orderError);
    return { success: false, error: "Order not found." };
  }

  const userId = order.user_id;

  // 2. Retract Cashback
  // We search for transactions related to this order that are credits (bonuses)
  const cashbackRef = `CASHBACK-${orderId}`;
  const { data: cashbackTx } = await supabase
    .from("transactions")
    .select("amount, id")
    .eq("reference", cashbackRef)
    .single();

  if (cashbackTx) {
    // Deduct the cashback from wallet
    const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", userId).single();
    if (wallet) {
      await supabase.from("wallets").update({ balance: wallet.balance - cashbackTx.amount }).eq("user_id", userId);
      // Create a reversal transaction
      await supabase.from("transactions").insert({
        user_id: userId,
        amount: -cashbackTx.amount,
        payment_status: "paid",
        payment_gateway: "feedme_system",
        transaction_id: `REV-${cashbackRef}`,
        reference: `REVERSAL-${orderId}`,
        description: `Cashback Retraction for refunded order ${order.reference}`
      });
    }
  }

  // 3. Retract Loyalty Points
  // Check if points were awarded. (Assuming 1 point for every 200k spent as per BONUS_CONFIG)
  // Or check for specific 'loyalty_points' prizes from spin
  const spinRefPrefix = `SPIN-`; // We might need a better way to link spin wins to orders if they happen after order
  // For now, if they spend > 200k, they get 1 point.
  if (order.total_amount_paid >= 200000) {
     const { data: profile } = await supabase.from('profiles').select('loyalty_points').eq('user_id', userId).single();
     if (profile && profile.loyalty_points > 0) {
        await supabase.from('profiles').update({ loyalty_points: profile.loyalty_points - 1 }).eq('user_id', userId);
     }
  }

  revalidatePath("/account/wallet");
  revalidatePath("/account/profile");

  return { success: true };
}
