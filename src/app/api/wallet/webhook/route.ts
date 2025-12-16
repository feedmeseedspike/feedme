import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "src/lib/supabaseClient";
import axios from "axios";
import admin from "@/utils/firebase/admin";
import { DEFAULT_DECEMBER_DEALS } from "src/lib/deals";

export async function POST(request: Request) {
  try {
    // Verify Paystack webhook signature
    const body = await request.json();
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY as string)
      .update(JSON.stringify(body))
      .digest("hex");

    if (hash !== request.headers.get("x-paystack-signature")) {
      return NextResponse.json(
        { message: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    if (body.event === "charge.success") {
      console.log("charge success");
      const { reference, amount, metadata } = body.data;

      // Update transaction status (if record exists)
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .update({ payment_status: "successful" })
        .eq("reference", reference)
        .eq("user_id", metadata.user_id)
        .select()
        .maybeSingle();

      if (txError) {
          console.error("Error updating transaction status:", txError);
      }

      // Handle based on payment type
      if (metadata.type === "wallet_funding") {
          if (transaction) {
               await handleWalletFunding(metadata, amount);
          } else {
               console.warn("Wallet funding succeeded but transaction record not found.");
          }
      } else if (metadata.type === "direct_payment") {
          await handleDirectPayment(metadata, amount, reference);
      }

      // Send push notification if user exists
      if (metadata.user_id) {
        await sendPushNotification(
          metadata.user_id,
          metadata.type,
          amount,
          metadata
        );
      }
    }

    return NextResponse.json({ message: "Webhook processed" });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

async function handleWalletFunding(metadata: any, amount: number) {
  const { data: wallet, error: fetchError } = await supabase
    .from("wallets")
    .select("balance")
    .eq("id", metadata.wallet_id)
    .eq("user_id", metadata.user_id)
    .single();

  if (fetchError || !wallet) throw new Error("Wallet not found");

  const newBalance = wallet.balance + amount / 100;
  const { error: walletError } = await supabase
    .from("wallets")
    .update({ balance: newBalance })
    .eq("id", metadata.wallet_id);

  if (walletError) throw walletError;
}

async function handleDirectPayment(
  metadata: any,
  amount: number,
  reference: string
) {
  // 1. Idempotency Check: Fetch current order status
  const { data: existingOrder, error: fetchError } = await supabase
    .from("orders")
    .select("payment_status")
    .eq("order_id", metadata.orderId)
    .single();

  if (fetchError) {
      console.error("Error fetching order for idempotency check:", fetchError);
      // Proceed with caution, or throw? If we can't read, update might fail anyway.
  } else if (existingOrder && existingOrder.payment_status === "Paid") {
      console.log(`Order ${metadata.orderId} is already Paid. Skipping processing.`);
      return;
  }

  // Update order status to paid
  let query = supabase
    .from("orders")
    .update({
      payment_status: "Paid",
      reference: reference,
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", metadata.orderId);

  if (metadata.user_id) {
    query = query.eq("user_id", metadata.user_id);
  }
  
  const { error: orderError } = await query;

  if (orderError) throw orderError;

  // --- CASHBACK LOGIC (Jolly 10% Off) ---
  // Only for authenticated users
  if (metadata.user_id) {
      const subtotal = Number(metadata.subtotal || 0); // Assuming Naira
      const jollyDeal = DEFAULT_DECEMBER_DEALS.JOLLY_CASHBACK;
      
      if (subtotal >= jollyDeal.min_spend) {
          try {
              const cashbackAmount = subtotal * jollyDeal.percentage;
              console.log(`Applying Jolly Cashback: ₦${cashbackAmount} for order ${metadata.orderId}`);

              // 1. Get Wallet
              let { data: wallet, error: walletError } = await supabase
                  .from("wallets")
                  .select("*")
                  .eq("user_id", metadata.user_id)
                  .single();

              if (!wallet && !walletError) {
                  // Create wallet if not exists
                  const { data: newWallet, error: createError } = await supabase
                      .from("wallets")
                      .insert({ user_id: metadata.user_id, balance: 0, currency: "NGN" })
                      .select()
                      .single();
                  if (!createError) wallet = newWallet;
              }

              if (wallet) {
                  // 2. Credit Wallet
                  const newBalance = (wallet.balance || 0) + cashbackAmount;
                  const { error: updateError } = await supabase
                      .from("wallets")
                      .update({ balance: newBalance })
                      .eq("id", wallet.id);

                  if (updateError) {
                      console.error("Failed to credit cashback to wallet:", updateError);
                  } else {
                      console.log(`Cashback credited successfully. New Balance: ${newBalance}`);
                      
                      // 3. Insert Transaction Record for History Visibility
                      const { error: txInsertError } = await supabase
                        .from("transactions")
                        .insert({
                             user_id: metadata.user_id,
                             amount: cashbackAmount,
                             description: "Cashback Reward: Jolly 10%",
                             reference: `cb_${metadata.orderId}_${Date.now()}`,
                             payment_status: "Paid",
                             type: "wallet_funding", // Using wallet_funding to ensure it shows as credit
                             created_at: new Date().toISOString()
                        });

                      if (txInsertError) {
                          console.error("Failed to insert cashback transaction record:", txInsertError);
                      }

                      // Optional: Send Cashback Notification?
                      await sendPushNotification(
                          metadata.user_id, 
                          "wallet_funding", 
                          cashbackAmount * 100, 
                          { ...metadata, type: 'cashback_reward' } 
                      );
                  }
              }
          } catch (err) {
              console.error("Error processing cashback:", err);
          }
      }
  }

  // Send order confirmation emails
  try {
    const emailRes = await axios.post(
      `${process.env.NEXT_PUBLIC_SITE_URL!}/api/email/send-order-confirmation`,
      {
        adminEmail: "orders.feedmeafrica@gmail.com",
        userEmail: metadata.email,
        adminOrderProps: {
          orderNumber: metadata.orderId,
          customerName: metadata.customerName,
          customerPhone: metadata.customerPhone,
          itemsOrdered: metadata.itemsOrdered,
          deliveryAddress: metadata.deliveryAddress,
          localGovernment: metadata.localGovernment,
        },
        userOrderProps: {
          orderNumber: metadata.orderId,
          customerName: metadata.customerName,
          customerPhone: metadata.customerPhone,
          itemsOrdered: metadata.itemsOrdered,
          deliveryAddress: metadata.deliveryAddress,
          deliveryFee: metadata.deliveryFee,
          serviceCharge: metadata.serviceCharge,
          totalAmount: metadata.amount,
          totalAmountPaid: metadata.subtotal,
          userid: metadata.user_id,
        },
      }
    );

    if (!emailRes.data.success) {
      console.error("Failed to send confirmation email:", emailRes.data.error);
    }
  } catch (err) {
    console.error("Failed to send confirmation email:", err);
  }
}

async function sendPushNotification(
  userId: string,
  paymentType: string,
  amount: number,
  metadata: any
) {
  try {
    // Fetch all FCM tokens for the user (web and mobile)
    const { data: tokens, error: tokenError } = await supabase
      .from("fcm_tokens")
      .select("fcm_token, device_type")
      .eq("user_id", userId);

    console.log({ tokenError, tokens });

    if (tokenError || !tokens || tokens.length === 0) {
      console.error("No FCM tokens found for user:", userId);
      return;
    }

    // Prepare notification message based on payment type
    let title: string, body: string;
    if (paymentType === "wallet_funding") {
      title = "Wallet Funded";
      body = `Your wallet has been funded with N${amount / 100}.`;
    } else if (paymentType === "direct_payment") {
      title = "Order Confirmed";
      body = `Your order #${metadata.orderId} for N${amount / 100} has been confirmed!`;
    } else {
      return; // Skip if payment type is unrecognized
    }

    // Send notification to all user devices
    const message = {
      notification: { title, body },
      tokens: tokens.map((token) => token.fcm_token), // Multi-device support
    };

    try {
      // Use sendToDevice for multiple tokens
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log("Push notification sent:", response);

      // Log failed tokens (e.g., expired or invalid)
      if (response.failureCount > 0) {
        response.responses.forEach((resp: any, idx: any) => {
          if (!resp.success) {
            console.error(
              `Failed to send to token ${tokens[idx].fcm_token}:`,
              resp.error.message
            );
            // Optionally delete invalid tokens
            if (
              resp.error.code === "messaging/registration-token-not-registered"
            ) {
              supabase
                .from("fcm_tokens")
                .delete()
                .eq("fcm_token", tokens[idx].fcm_token)
                .then(() =>
                  console.log(`Deleted invalid token: ${tokens[idx].fcm_token}`)
                );
            }
          }
        });
      }
    } catch (err: any) {
      console.error("Error sending push notification:", err.message);
    }
  } catch (err: any) {
    console.error("Error in sendPushNotification:", err.message);
  }
}
