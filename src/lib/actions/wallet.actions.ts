"use server";

import { createClient } from "@utils/supabase/server";
import { OrderData } from "src/utils/types"; // Corrected import path based on previous fix
import { revalidatePath } from "next/cache";
import { BONUS_CONFIG, calculatePotentialCashBack } from "src/lib/deals";
import { createVoucher } from "./voucher.actions";
import { sendUnifiedNotification } from "./notifications.actions";

export async function processWalletPayment(orderData: OrderData) {
  const supabase = await createClient(); // Await the client creation

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return { success: false, error: "User not authenticated." };
  }

  const userId = userData.user.id;

  // Basic security check: Ensure the order data belongs to the authenticated user
  if (orderData.userId !== userId) {
    return { success: false, error: "Order data mismatch." };
  }

  // Fetch user's current wallet balance
  let { data: walletData, error: walletError } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (walletError || !walletData) {
    // Try to auto-create a wallet row if missing
    const { error: createWalletError } = await supabase
      .from("wallets")
      .insert({ user_id: userId, balance: 0 });
    if (createWalletError) {
      return { success: false, error: "Could not create wallet for user." };
    }
    // Retry fetching the wallet
    ({ data: walletData, error: walletError } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single());
    if (walletError || !walletData) {
      return { success: false, error: "Could not retrieve wallet information." };
    }
  }

  // Check if balance is null and handle it
  if (walletData.balance === null) {
      return { success: false, error: "Invalid wallet balance." };
  }

  const currentBalance = walletData.balance;
  const amountToDeduct = Math.max(orderData.totalAmountPaid, 0);

  // Check if balance is sufficient 
  if (currentBalance < amountToDeduct) {
    return { success: false, error: "Insufficient wallet balance." };
  }

  // Start a transaction (basic implementation, consider using database transactions if available)
  try {
    // Validate offer availability before processing payment
    const offerItems = orderData.cartItems.filter(item => item.offerId);
    for (const offerItem of offerItems) {
      const { data: offerData, error: offerError } = await supabase
        .from('offers')
        .select('available_slots, status, title')
        .eq('id', offerItem.offerId)
        .single();

      if (offerError || !offerData) {
        return { success: false, error: `Failed to validate offer availability.` };
      }

      if (offerData.status !== 'active') {
        return { success: false, error: `Offer "${offerData.title}" is no longer active.` };
      }

      if (offerData.available_slots < offerItem.quantity) {
        return { success: false, error: `Only ${offerData.available_slots} slots available for "${offerData.title}".` };
      }
    }

    // Deduct amount from wallet
    const { error: deductionError } = await supabase
      .from("wallets")
      .update({ balance: currentBalance - amountToDeduct })
      .eq("user_id", userId);

    if (deductionError) {
      throw new Error("Failed to deduct from wallet.");
    }

    // Generate Reference
    const reference = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create the order record
    const { data: orderResult, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: orderData.userId,
        total_amount: orderData.totalAmount,
        total_amount_paid: orderData.totalAmountPaid,
        voucher_id: orderData.voucherId || null,
        shipping_address: JSON.stringify(orderData.shippingAddress),
        payment_method: orderData.paymentMethod, // 'wallet'
        payment_status: "Paid", 
        reference: reference,
        note: orderData.note,
      })
      .select()
      .single();

    if (orderError || !orderResult) {
      throw new Error("Failed to create order record.");
    }

    // Insert order items
    const orderItems = orderData.cartItems.map((item: { productId: string; quantity: number; price?: number | null; option?: any; bundleId?: string; offerId?: string }) => ({
        order_id: orderResult.id,
        product_id: item.productId || null,
        bundle_id: item.bundleId || null,
        offer_id: item.offerId || null,
        quantity: item.quantity,
        price: item.price,
        option: item.option || null,
    }));

    const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

    if(orderItemsError) {
        throw new Error("Failed to create order items.");
    }

    // Insert transaction row for this order
    await supabase.from("transactions").insert({
      user_id: userId,
      order_id: orderResult.id,
      amount: amountToDeduct,
      payment_status: "paid",
      payment_gateway: "wallet",
      transaction_id: `WALLET-${orderResult.id}`,
      reference: `WALLET-${orderResult.id}`,
    });

    // --- Process Post-Order Rewards (Cashback, Voucher, Points, Referral) ---
    // Fetch product details for item-specific deals logic (passed to rewards processor)
    const productIds = orderData.cartItems.map((i: any) => i.productId).filter(Boolean);
    let dealItems: any[] = [];
    
    if (productIds.length > 0) {
        const { data: products } = await supabase
            .from('products')
            .select('id, name, category, price')
            .in('id', productIds);
            
        dealItems = orderData.cartItems.map((item: any) => ({
            ...item,
            quantity: item.quantity,
            price: item.price,
            products: products?.find(p => p.id === item.productId) || { name: '' }
        }));
    }

    // Call Shared Rewards Logic
    const { processOrderRewards } = await import("./rewards.actions");
    const rewardsResult = await processOrderRewards(
      userId,
      orderResult.id,
      orderData.totalAmountPaid,
      dealItems
    );

    const rewards = rewardsResult.success ? rewardsResult.rewards : { cashback: 0, freeDeliveryBonus: false, pointsAwarded: 0 };

    // Revalidate cache for relevant pages (e.g., wallet balance, order history)
    revalidatePath("/account/wallet");
    revalidatePath("/account/orders");
    revalidatePath("/account/profile"); // Points update

    // Send order confirmation notification
    await sendUnifiedNotification({
      userId,
      type: 'info',
      title: 'Order Confirmed',
      body: `Your order #${orderResult.id} for ${orderData.totalAmountPaid} has been confirmed.`,
      link: `/order/order-confirmation?id=${orderResult.id}`
    });

    return { 
      success: true, 
      data: { 
        orderId: orderResult.id, 
        reference: reference,
        rewards: rewards 
      } 
    };

  } catch (error: any) {
    // Basic rollback mechanism: if order creation/items failed, try to refund the wallet
    if (walletData && walletData.balance !== null) { // Only attempt refund if initial deduction happened and balance was not null
        await supabase
            .from("wallets")
            .update({ balance: walletData.balance })
            .eq("user_id", userId);
        // Log refund attempt result
    }
    return { success: false, error: error.message || "An error occurred during payment processing." };
  }
} 

export async function getWalletBalanceServer(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return 0;
  return data.balance || 0;
} 

import supabaseAdmin from "src/utils/supabase/admin";

export async function creditWallet(
  userId: string, 
  amount: number, 
  description: string, 
  reference: string
) {
  const supabase = supabaseAdmin;

  // Fetch current wallet
  let { data: walletData, error: walletError } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (walletError || !walletData) {
      // Try creating if doesn't exist
      const { error: createError } = await supabase.from("wallets").insert({ user_id: userId, balance: 0 });
      if (createError) return { success: false, error: "Could not create wallet." };
      
      const res = await supabase.from("wallets").select("balance").eq("user_id", userId).single();
      walletData = res.data;
  }

  if (!walletData) return { success: false, error: "Wallet not found." };

  const currentBalance = walletData.balance ?? 0;
  const newBalance = currentBalance + amount;

  // Update wallet
  const { error: updateError } = await supabase
      .from("wallets")
      .update({ balance: newBalance })
      .eq("user_id", userId);

  if (updateError) return { success: false, error: "Failed to update wallet balance." };

  // Insert transaction record
  const { error: txError } = await supabase.from("transactions").insert({
      user_id: userId,
      amount: amount, // Positive for credit
      payment_status: "paid", // Confirmed credit
      payment_gateway: "feedme_system", // Internal system credit
      transaction_id: reference,
      reference: reference, 
      description: description,
      created_at: new Date().toISOString()
  });

  if (txError) {
      console.error("Failed to insert credit transaction:", txError);
      // We don't rollback the balance update here for simplicity but in prod we should using a transaction
  }

  // Send notification for wallet credit
  try {
     await sendUnifiedNotification({
       userId,
       type: "info",
       title: "Wallet Credited",
       body: `Your wallet has been credited with N${amount}. ${description}`,
       link: "/account/wallet"
     });
  } catch (err) {
     console.warn("Wallet credit notification failed:", err);
  }

  revalidatePath("/account/wallet");
  return { success: true };
}