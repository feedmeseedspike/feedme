"use server";

import { createClient } from "@utils/supabase/server";
import { cookies } from "next/headers";
import { creditWallet } from "./wallet.actions";
import { createVoucher } from "./voucher.actions";
import { addToCart } from "./cart.actions";
import { sendMail } from "src/utils/email/mailer";
import { SPIN_PRIZES_CONFIG } from "../deals";

import { getSpinPrizes } from "./prize.actions";

export async function spinTheWheel() {
  const supabase = await createClient();

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "You must be logged in to spin." };
  }

  // 1.5. Check User Order History
  const { count, error: countError } = await supabase
    .from("orders")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", user.id)
    .in("payment_status", ["Paid"]) 
    .in("status", ["Confirmed", "order confirmed", "Processing", "order delivered"]);

  if (countError) {
      console.error("Spin Eligibility Check Failed:", countError);
      return { success: false, error: "System error: Could not verify eligibility." };
  }

  // Determine if this is a "New User" spin
  const isNewUser = (count === 0);

  // 1.6. Check if user has already used their new user spin
  const { data: profile } = await supabase
    .from('profiles')
    .select('has_used_new_user_spin')
    .eq('user_id', user.id)
    .single();

  if (isNewUser && profile?.has_used_new_user_spin) {
      return { success: false, error: "You've already used your welcome spin! Shop more to unlock more spins. 🎡" };
  }

  // Fetch Prizes
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

  if (isNewUser) {
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
      await supabase.from('profiles').update({ has_used_new_user_spin: true }).eq('user_id', user.id);
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
  }

  // 3. Process Reward
  try {
    let resultMessage = selectedPrize.type === 'none' ? "Better luck next time!" : `Congratulations! You won ${selectedPrize.label} ${selectedPrize.sub || ''}`;
    let data : { code: string; [key: string]: any } | null = null;
    const refId = `SPIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    if (selectedPrize.type === 'wallet_cash') {
      // Credit Wallet
      await creditWallet(user.id, selectedPrize.value, `Spin & Win Reward`, refId);
      resultMessage = `₦${selectedPrize.value} has been added to your wallet!`;
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
