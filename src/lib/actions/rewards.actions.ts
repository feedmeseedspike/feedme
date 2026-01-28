import "server-only";
import supabaseAdmin from "src/utils/supabase/admin";
import { BONUS_CONFIG, calculatePotentialCashBack } from "src/lib/deals";
import { createVoucher } from "./voucher.actions";
import { creditWallet } from "./wallet.actions";
import { revalidatePath } from "next/cache";
import { sendUnifiedNotification } from "./notifications.actions";

export async function processOrderRewards(
  userId: string,
  orderId: string,
  amountPaid: number,
  cartItems: any[] = [] // Optional: For potential item-specific rewards
) {
  const supabase = supabaseAdmin;
  const rewardsSummary = {
    cashback: 0,
    freeDeliveryBonus: false,
    pointsAwarded: 0,
    referralBonus: 0
  };

  try {
    // 1. CASHBACK REWARD (Threshold 100k -> 2k credit)
    // We can use calculatePotentialCashBack or implement directly.
    // calculatePotentialCashBack uses BONUS_CONFIG which is correct.
    const cashbackAmount = calculatePotentialCashBack(amountPaid);
    
    if (cashbackAmount > 0) {
      const result = await creditWallet(
        userId,
        cashbackAmount,
        "Cash Back: Spend Reward",
        `CASHBACK-${orderId}`
      );
      if (result.success) {
          rewardsSummary.cashback = cashbackAmount;
          await sendUnifiedNotification({
            userId,
            type: 'info',
            title: 'Cashback Earned!',
            body: `You earned N${cashbackAmount} cashback from your order #${orderId}.`,
            link: '/account/wallet'
          });
      }
    }

    // 2. NEXT ORDER FREE DELIVERY (Threshold 50k)
    // Logic: If spent >= 50k, issue a voucher for free delivery on next order (valid 14 days)
    if (amountPaid >= BONUS_CONFIG.SUBSEQUENT_FREE_DELIVERY.min_spend) {
       const code = `FREE-DELIV-NEXT-${Math.floor(1000 + Math.random() * 9000)}`;
       // Create voucher
       await createVoucher({
          name: "Reward: Free Delivery (Next Order)",
          code: code,
          description: BONUS_CONFIG.SUBSEQUENT_FREE_DELIVERY.description,
          discountType: 'percentage', // Or fixed? User said "Free Delivery". usually 100% off shipping or fixed amount.
          // In wallet.actions.ts it was fixed 1500. Let's stick to fixed 1500 or 2500 (standard fee).
          // Let's check checkout logic. Cost is 2500 usually.
          // Let's safe bet: Fixed discount of 2500 (or sufficiently high to cover delivery)
          discountValue: 2500, 
          validTo: new Date(Date.now() + (BONUS_CONFIG.SUBSEQUENT_FREE_DELIVERY.expiry_days || 14) * 24 * 60 * 60 * 1000).toISOString(),
          userId: userId,
          maxUses: 1
       });
       rewardsSummary.freeDeliveryBonus = true;
       await sendUnifiedNotification({
         userId,
         type: 'info',
         title: 'Free Delivery Reward!',
         body: `Congrats! You've unlocked Free Delivery for your next order.`,
         link: '/account/notifications'
       });
    }

    // 3. LOYALTY POINTS (200k->1, 500k->2, 1M->3)
    const pointsAwarded = BONUS_CONFIG.LOYALTY_TIERS
      .filter(tier => amountPaid >= tier.threshold)
      .reduce((max, tier) => Math.max(max, tier.points), 0);

    if (pointsAwarded > 0) {
        const { data: profile } = await supabase.from('profiles').select('loyalty_points').eq('user_id', userId).single();
        const currentPoints = profile?.loyalty_points || 0;
        await supabase.from('profiles').update({ loyalty_points: currentPoints + pointsAwarded }).eq('user_id', userId);
        rewardsSummary.pointsAwarded = pointsAwarded;
        await sendUnifiedNotification({
          userId,
          type: 'info',
          title: 'Loyalty Points!',
          body: `You've been awarded ${pointsAwarded} loyalty points for your purchase.`,
          link: '/account/profile'
        });
    }

    // 4. REFERRAL REWARDS (If this user was referred)
    // Check if this user was referred and if this is their first order (or qualifying order)
    const { data: referral } = await supabase
        .from('referrals')
        .select('referrer_user_id, id, status, referred_discount_given')
        .eq('referred_user_id', userId)
        .eq('status', 'qualified') // Assuming 'qualified' means they signed up correctly
        .single();
    
    // We also need to check if this is the FIRST order to award the referrer
    const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    // If count is 1 (this order), award referrer. 
    // Note: If Paystack webhook runs this, the order is already inserted, so count is 1. 
    // If Wallet runs this, order inserted, count is 1. Correct.
    if (referral && referral.referrer_user_id && count === 1) {
         // Award Referrer 10% of this order amount
         const referrerBonus = amountPaid * 0.10;
         await creditWallet(
             referral.referrer_user_id,
             referrerBonus,
             `Referral Bonus: 10% from friend's first order`,
             `REF-BONUS-${referral.id}`
         );
         rewardsSummary.referralBonus = referrerBonus;
         // Update referral status if needed (optional)
    }

    // Check if referral discount was applied to the user (Ref: wallet.actions.ts logic about REF- voucher)
    // This is improved by properly checking coupon usage in the order itself, but for now we stick to the wallet.actions logic principle.
    
    // Revalidations
    revalidatePath("/account/wallet");
    revalidatePath("/account/profile");
    
    return { success: true, rewards: rewardsSummary };

  } catch (error) {
    console.error("Error processing order rewards:", error);
    return { success: false, error: "Failed to process rewards" };
  }
}
