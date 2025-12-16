"use server";

import { createClient } from "@utils/supabase/server";
import { cookies } from "next/headers";
// import { revalidatePath } from "next/cache"; // Removed to prevent refresh
import { creditWallet } from "./wallet.actions";
import { createVoucher } from "./voucher.actions";
import { SPIN_PRIZES_CONFIG } from "../deals";

export async function spinTheWheel() {
  const supabase = await createClient();

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "You must be logged in to spin." };
  }

  // 2. Logic
  const rand = Math.random();
  let cumulativeProbability = 0;
  let selectedPrize = SPIN_PRIZES_CONFIG[1]; 

  for (const prize of SPIN_PRIZES_CONFIG) {
    cumulativeProbability += prize.probability;
    if (rand <= cumulativeProbability) {
      selectedPrize = prize;
      break;
    }
  }

  // 3. Process Reward
  try {
    let resultMessage = "Better luck next time!";
    let data = null;
    const refId = `SPIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    if (selectedPrize.type === 'wallet_cash') {
      // Credit Wallet
      await creditWallet(user.id, selectedPrize.value, `Spin & Win Reward`, refId);
      resultMessage = `₦${selectedPrize.value} has been added to your wallet!`;
    } 
    else if (selectedPrize.type === 'voucher_percent') {
      // Create Voucher
      const code = `SPIN${Math.floor(1000 + Math.random() * 9000)}`; 
      await createVoucher({
         name: "Spin & Win Reward", 
         code: code,
         discountType: 'percentage', 
         discountValue: selectedPrize.value,
         validTo: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), 
         userId: user.id
      });
      resultMessage = `You won ${selectedPrize.value}% OFF! Code: ${code}`;
      data = { code };
    }
    else if (selectedPrize.type === 'item') {
         const code = selectedPrize.code || "FREE-ITEM";
          await createVoucher({
             name: "Spin & Win Item",
             code: code,
             discountType: 'fixed',
             discountValue: selectedPrize.value,
             validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), 
             userId: user.id,
             minOrderAmount: 5000 
          });
          resultMessage = `You won a FREE Pack of Dates! Code: ${code}`;
          data = { code };
    }
    
    return { 
        success: true, 
        message: resultMessage,
        prize: {
            id: selectedPrize.id,
            type: selectedPrize.type,
            data: data
        }
    };

  } catch (error) {
    console.error("Spin Error:", error);
    return { success: false, error: "Failed to process prize. Please try again." };
  }
}
