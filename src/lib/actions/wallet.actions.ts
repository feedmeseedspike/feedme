"use server";

import { createClient } from "@utils/supabase/server";
import { OrderData } from "src/utils/types"; // Corrected import path based on previous fix
import { revalidatePath } from "next/cache";

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
  const { data: walletData, error: walletError } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (walletError || !walletData) {
    console.error("Error fetching wallet:", walletError?.message);
    return { success: false, error: "Could not retrieve wallet information." };
  }

  // Check if balance is null and handle it
  if (walletData.balance === null) {
      console.error("Wallet balance is null for user:", userId);
      return { success: false, error: "Invalid wallet balance." };
  }

  const currentBalance = walletData.balance;
  const amountToDeduct = Math.max(orderData.totalAmountPaid, 0);

  // Check if balance is sufficient (should also be checked on frontend, but double-check here)
  if (currentBalance < amountToDeduct) {
    return { success: false, error: "Insufficient wallet balance." };
  }

  // Start a transaction (basic implementation, consider using database transactions if available)
  try {
    // Deduct amount from wallet
    const { error: deductionError } = await supabase
      .from("wallets")
      .update({ balance: currentBalance - amountToDeduct })
      .eq("user_id", userId);

    if (deductionError) {
      console.error("Error deducting from wallet:", deductionError.message);
      throw new Error("Failed to deduct from wallet.");
    }

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
        payment_status: "Paid", // Mark as paid since wallet deduction is immediate
        // Add other necessary order fields
      })
      .select()
      .single();

    if (orderError || !orderResult) {
      console.error("Error creating order:", JSON.stringify(orderError, null, 2));
      throw new Error("Failed to create order record.");
    }

    // Insert order items
    const orderItems = orderData.cartItems.map((item: { productId: string; quantity: number; price?: number | null; option?: any; bundleId?: string }) => ({
        order_id: orderResult.id,
        product_id: item.productId || null,
        bundle_id: item.bundleId || null,
        quantity: item.quantity,
        price: item.price,
        option: item.option || null,
    }));

    const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

    if(orderItemsError) {
        console.error("Error inserting order items:", orderItemsError.message);
        throw new Error("Failed to create order items.");
    }

    // Insert transaction row for this order
    await supabase.from("transactions").insert({
      user_id: userId,
      order_id: orderResult.id,
      amount: amountToDeduct,
      payment_status: "successful",
      payment_gateway: "wallet",
      transaction_id: `WALLET-${orderResult.id}`,
      reference: `WALLET-${orderResult.id}`,
    });

    // Revalidate cache for relevant pages (e.g., wallet balance, order history)
    revalidatePath("/account/wallet");
    revalidatePath("/account/orders");

    return { success: true, data: { orderId: orderResult.id } };

  } catch (error: any) {
    // Basic rollback mechanism: if order creation/items failed, try to refund the wallet
    console.error("Transaction failed, attempting rollback:", error.message);
    // NOTE: A more robust transaction handling (e.g., using database features) is recommended
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