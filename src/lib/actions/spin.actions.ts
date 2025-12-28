"use server";

import { createClient } from "@utils/supabase/server";
import { cookies } from "next/headers";
// import { revalidatePath } from "next/cache"; // Removed to prevent refresh
import { creditWallet } from "./wallet.actions";
import { createVoucher } from "./voucher.actions";
import { SPIN_PRIZES_CONFIG } from "../deals";

import { getSpinPrizes } from "./prize.actions";

export async function spinTheWheel() {
  const supabase = await createClient();

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "You must be logged in to spin." };
  }

  // Fetch Prizes from DB or fallback
  let dbPrizes = await getSpinPrizes();
  let prizes: any[] = [];
  
  if (dbPrizes && dbPrizes.length > 0) {
      prizes = dbPrizes.map(p => ({
          ...p,
          label: p.label,
          value: p.value,
          image: p.image_url || p.product?.images?.[0],
          color: { bg: p.color_bg, text: p.color_text },
          sub: p.sub_label
      }));
  } else {
      prizes = SPIN_PRIZES_CONFIG;
  }

  // 2. Logic
  const rand = Math.random();
  let cumulativeProbability = 0;
  let selectedPrize = prizes[prizes.length - 1]; // Default to last (usually No Prize)

  for (const prize of prizes) {
    cumulativeProbability += prize.probability;
    if (rand <= cumulativeProbability) {
      selectedPrize = prize;
      break;
    }
  }

  // 3. Process Reward
  try {
    let resultMessage = "Better luck next time!";
    let data : { code: string; [key: string]: any } | null = null;
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
         // Auto-add to cart Logic
         const productId = selectedPrize.product_id || selectedPrize.product?.id;
         
         if (productId) {
             try {
                // Dynamically import to avoid circular dependencies if any
                const { addToCart } = await import('./cart.actions');
                await addToCart(productId, 1);
                console.log(`Auto-added prize product ${productId} to cart`);
             } catch (err) {
                 console.error("Failed to auto-add prize to cart:", err);
             }
         }

         const baseCode = selectedPrize.code || (selectedPrize.label ? `FREE-${selectedPrize.label.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase()}` : "FREE-ITEM");
         // Append random string to ensure uniqueness per user/win
         const code = `${baseCode}-${Math.floor(1000 + Math.random() * 9000)}`;
         
         // Create a Fixed Value Voucher equivalent to the item value
         // We assume 'value' on the prize is the price of the item
         console.log("Creating voucher for item prize:", { label: selectedPrize.label, code, value: selectedPrize.value, userId: user.id });
         
         const voucherRes = await createVoucher({
             name: `Prize: ${selectedPrize.label}`,
             code: code,
             discountType: 'fixed',
             discountValue: selectedPrize.value,
             validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), 
             userId: user.id,
             minOrderAmount: 0 
          });

          if (!voucherRes.success) {
              console.error("Failed to create voucher:", voucherRes.error);
              throw new Error("Failed to create prize voucher.");
          }
          console.log("Voucher created successfully:", voucherRes);

          // If product add was successful or not, we still give the voucher
          resultMessage = `You won: ${selectedPrize.label}! Item added to cart & Code applied.`;
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
    return { success: false, error: (error as any)?.message || "Failed to process prize." };
  }
}

