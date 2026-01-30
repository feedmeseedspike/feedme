"use server";

import { createClient } from "@utils/supabase/server";
import { cookies } from "next/headers";
import { creditWallet } from "./wallet.actions";
import { createVoucher } from "./voucher.actions";
import { addToCart } from "./cart.actions";
import { sendMail } from "src/utils/email/mailer";
import { SPIN_PRIZES_CONFIG } from "../deals";

import { getSpinPrizes } from "./prize.actions";
import supabaseAdmin from "src/utils/supabase/admin";
import { sendUnifiedNotification } from "./notifications.actions";

export async function spinTheWheel() {
  const supabase = await createClient();

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "You must be logged in to spin." };
  }

  // 1.5. Check User Order History
  // Use admin client for eligibility to avoid potential RLS delays/errors
  // Simplified query to identify failure point
  console.log("Checking eligibility for User ID:", user.id);
  
  const { count, error: countError } = await supabaseAdmin
    .from("orders")
    .select("id", { count: 'exact', head: true })
    .eq("user_id", user.id);

  if (countError) {
      console.error("Spin Eligibility Check Failed (Step 1):", JSON.stringify(countError, null, 2));
      return { success: false, error: `System error: Could not verify eligibility. (${countError.code || 'UNKNOWN'})` };
  }

  // If we have orders, let's filter them more strictly in memory or via another query if needed,
  // but for now, let's just see if ANY orders exist.
  // The original status filters might be causing the "empty message" error if types mismatch.
  const isNewUser = (count === 0);
  console.log(`User ${user.id} has ${count} orders. isNewUser: ${isNewUser}`);

  // 1.6. Check if user has already used their new user spin
  // Use admin to avoid RLS delays
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('has_used_new_user_spin, last_spin_at')
    .eq('user_id', user.id)
    .single();

  if (profileError) {
      console.error("Spin Profile Check Failed:", profileError);
  }

  // 1.7. Check Spin Frequency (Once per 24 hours)
  if (profile?.last_spin_at) {
    const lastSpin = new Date(profile.last_spin_at);
    const now = new Date();
    const hoursSinceLastSpin = (now.getTime() - lastSpin.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastSpin < 24) {
      const remainingHours = Math.ceil(24 - hoursSinceLastSpin);
      return { 
        success: false, 
        error: `You've already spun recently! Please come back in ${remainingHours} hour${remainingHours > 1 ? 's' : ''}. 🎡` 
      };
    }
  }

  // Returning user with 0 orders fallback logic
  let forceTryAgain = false;
  if (isNewUser && profile?.has_used_new_user_spin) {
      console.log("Returning user with 0 orders: Forcing 'Try Again' result.");
      forceTryAgain = true;
  }

  // Fetch Prizes
  console.log("Fetching prizes from database...");
  let dbPrizes = await getSpinPrizes();
  let prizes: any[] = [];
  
  if (dbPrizes && dbPrizes.length > 0) {
      prizes = dbPrizes.map(p => ({
          ...p,
          label: p.label,
          value: p.value,
          image: p.image_url || ((p as any).product?.images?.[0]),
          color: { bg: p.color_bg, text: p.color_text },
          sub: p.sub_label
      }));
  } else {
      prizes = SPIN_PRIZES_CONFIG;
  }

  // 2. Selection Logic
  let selectedPrize: any;

  if (forceTryAgain) {
      // Force 'Try Again' for returning 0-order users
      selectedPrize = prizes.find(p => p.type === 'none') || prizes[0];
  } else if (isNewUser) {
      // NEW USER LOGIC: 100% probability for "New User Only" prizes
      const newUserPrizes = prizes.filter(p => p.for_new_users_only === true);
      
      if (newUserPrizes.length > 0) {
          // If multiple new user prizes exist, pick one randomly among them
          selectedPrize = newUserPrizes[Math.floor(Math.random() * newUserPrizes.length)];
      } else {
          // Fallback if no specific new user prize is configured
          selectedPrize = prizes.find(p => p.type === 'voucher_percent' && p.value === 10) || prizes[0];
      }
      
      // Update profile immediately to prevent double-dipping via rapid clicks
      // Ensure profile exists or update
      await supabaseAdmin.from('profiles').update({ 
        has_used_new_user_spin: true,
        last_spin_at: new Date().toISOString()
      }).eq('user_id', user.id);
  } else {
      // EXISTING USER LOGIC: Regular random probability
      // We filter OUT the new user prizes to keep the pool clean
      const regularPrizes = prizes.filter(p => p.for_new_users_only !== true);
      const rand = Math.random();
      let cumulativeProbability = 0;
      selectedPrize = regularPrizes[regularPrizes.length - 1]; 

      for (const prize of regularPrizes) {
        cumulativeProbability += (prize.probability || 0);
        if (rand <= cumulativeProbability) {
          selectedPrize = prize;
          break;
        }
      }

      // Update last spin time for existing users too
      await supabaseAdmin.from('profiles').update({ 
        last_spin_at: new Date().toISOString()
      }).eq('user_id', user.id);
  }

  // VALIDATION: If is an 'item' prize, it MUST have a product_id. 
  // If not, fallback to a safe 'none' or 'voucher' prize to prevent errors.
  if (selectedPrize.type === 'item' && !selectedPrize.product_id) {
      console.warn("Selected 'item' prize missing product_id, falling back to 'none'");
      // Find a try again prize
      selectedPrize = prizes.find(p => p.type === 'none') || prizes[0];
  }

  console.log("Selected Prize:", selectedPrize.label, "Type:", selectedPrize.type);

  // 3. Process Reward
  try {
    let resultMessage = selectedPrize.type === 'none' ? "Better luck next time!" : `Congratulations! You won ${selectedPrize.label} ${selectedPrize.sub || ''}`;
    let data : { code: string; [key: string]: any } | null = null;
    const refId = `SPIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    if (selectedPrize.type === 'wallet_cash') {
      // Credit Wallet
      await creditWallet(user.id, selectedPrize.value, `Spin & Win Reward`, refId);
      resultMessage = `₦${selectedPrize.value} has been added to your wallet!`;

      // Unified Notification
      await sendUnifiedNotification({
          userId: user.id,
          type: 'info',
          title: "💰 Wallet Credited!",
          body: `₦${selectedPrize.value} has been added to your wallet from the Spin Wheel.`,
          link: '/account/wallet'
      });
    } 
    else if (selectedPrize.type === 'loyalty_points') {
      // Credit Loyalty Points
      const { data: profile } = await supabase.from('profiles').select('loyalty_points').eq('user_id', user.id).single();
      const currentPoints = profile?.loyalty_points || 0;
      await supabase.from('profiles').update({ loyalty_points: currentPoints + selectedPrize.value }).eq('user_id', user.id);
      resultMessage = `You won ${selectedPrize.value} Loyalty Points!`;
    }
    else if (selectedPrize.type === 'free_delivery') {
      // Create Free Delivery Voucher
      const code = `FREE-DELIV-${Math.floor(1000 + Math.random() * 9000)}`;
      await createVoucher({
         name: "Spin & Win: Free Delivery", 
         code: code,
         discountType: 'fixed', 
         discountValue: 1500, // Assuming 1500 is average delivery fee
         validTo: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), 
         userId: user.id
      });
      resultMessage = `You won FREE DELIVERY on your next order! Code: ${code}`;
      data = { code };

      // Unified Notification (In-App + Push)
      await sendUnifiedNotification({
          userId: user.id,
          type: 'info',
          title: "🎁 You Won Free Delivery!",
          body: `Use code ${code} within 14 days to claim your free delivery reward!`,
          link: '/checkout'
      });

      // Notify User via Email
      try {
        await sendMail({
            to: user.email!,
            subject: `🎁 You Won Free Delivery!`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #1B6013;">Congratulations! 🎉</h2>
                    <p>You just won <strong>Free Delivery</strong> on the Spin & Win wheel!</p>
                    <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; border: 1px solid #bbf7d0; margin: 20px 0; text-align: center;">
                        <p style="margin: 0 0 10px 0; color: #166534; font-size: 14px;">Your Voucher Code</p>
                        <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1B6013; letter-spacing: 1px;">${code}</p>
                    </div>
                    <p>Use this code at checkout to get free delivery (up to ₦1,500) on your next order.</p>
                    <p style="color: #666; font-size: 12px; margin-top: 20px;">Detailed terms apply. Expires in 14 days.</p>
                </div>
            `
        });
      } catch (err) {
        console.error("Failed to send user prize email", err);
      }
    }
    else if (selectedPrize.type === 'voucher_percent') {
      // Create Voucher
      const code = `SPIN${Math.floor(1000 + Math.random() * 9000)}`; 
      await createVoucher({
         name: "Spin & Win Reward", 
         code: code,
         discountType: 'percentage', 
         discountValue: selectedPrize.value,
         validTo: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), 
         userId: user.id
      });
      resultMessage = `You won ${selectedPrize.value}% OFF! Code: ${code}`;
      data = { code };

      // Unified Notification (In-App + Push)
      await sendUnifiedNotification({
          userId: user.id,
          type: 'info',
          title: `🎁 You Won ${selectedPrize.value}% OFF!`,
          body: `Use code ${code} within 14 days to get ${selectedPrize.value}% discount on your next order.`,
          link: '/checkout'
      });

      // Notify User via Email
      try {
        await sendMail({
            to: user.email!,
            subject: `🎁 You Won ${selectedPrize.value}% OFF!`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #1B6013;">Congratulations! 🎉</h2>
                    <p>You just won a <strong>${selectedPrize.value}% Discount</strong> on the Spin & Win wheel!</p>
                    <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; border: 1px solid #bbf7d0; margin: 20px 0; text-align: center;">
                        <p style="margin: 0 0 10px 0; color: #166534; font-size: 14px;">Your Voucher Code</p>
                        <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1B6013; letter-spacing: 1px;">${code}</p>
                    </div>
                    <p>Use this code at checkout to claim your discount.</p>
                    <p style="color: #666; font-size: 12px; margin-top: 20px;">Detailed terms apply. Expires in 14 days.</p>
                </div>
            `
        });
      } catch (err) {
        console.error("Failed to send user prize email", err);
      }
    }
    // NEW: Handle Physical Item Prizes (e.g. Chicken)
    else if (selectedPrize.type === 'item') {
        if (selectedPrize.product_id) {
            // Add directly to cart as a free item (price = 0)
            // We pass a distinct option object so it doesn't merge with regular paid items of the same product
            await addToCart(selectedPrize.product_id, 1, { _is_prize: true, label: "🏆 Prize: " + selectedPrize.label } as any, null, null, null, 0);
            
            resultMessage = `You've unlocked ${selectedPrize.label}! It has been added to your cart.`;

            // Notify Admin
            try {
                const adminEmail = "orders.feedmeafrica@gmail.com"; 
                await sendMail({
                    to: adminEmail,
                    subject: `🎰 SPIN WIN: ${selectedPrize.label} won by ${user.email}`,
                    html: `
                        <div style="font-family: sans-serif; padding: 20px;">
                            <h2 style="color: #1B6013;">Spin & Win Alert 🎰</h2>
                            <p>A user has won a physical prize!</p>
                            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p><strong>User:</strong> ${user.email}</p>
                                <p><strong>Prize:</strong> ${selectedPrize.label}</p>
                                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                            </div>
                            <p>The item has been automatically added to their cart for ₦0.</p>
                        </div>
                    `
                });
            } catch (err) {
                console.error("Failed to send admin spin notification", err);
                // Don't block the user flow
            }

        } else {
            console.error("Prize item missing product_id");
            resultMessage = `You won ${selectedPrize.label}, but we couldn't add it to your cart. Contact support!`;
        }
    }
    
    return { 
        success: true, 
        message: resultMessage,
        prize: {
            ...selectedPrize,
            data: data
        }
    };

  } catch (error) {
    console.error("Spin Error:", error);
    return { success: false, error: (error as any)?.message || "Failed to process prize." };
  }
}
