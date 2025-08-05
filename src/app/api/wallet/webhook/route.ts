import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "src/lib/supabaseClient";
import axios from "axios";
import admin from "@/utils/firebase/admin";

export async function POST(request: Request) {
  try {
    // Verify Paystack webhook signature
    const body = await request.json();
    console.log({
      body: body.data,
    });
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
      console.log({ amount, metadata });

      // Update transaction status
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .update({ payment_status: "successful" })
        .eq("reference", metadata.orderId)
        .eq("user_id", metadata.user_id)
        .select()
        .single();

      if (txError) throw txError;
      console.log({ transaction });

      if (transaction) {
        // Handle based on payment type
        if (metadata.type === "wallet_funding") {
          await handleWalletFunding(metadata, amount);
        } else if (metadata.type === "direct_payment") {
          await handleDirectPayment(metadata, amount, metadata.orderId);
        }

        // Send push notification
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
  console.log("Processing wallet funding");

  // Update wallet balance
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

  console.log(
    `Wallet funded: ${amount / 100} added to wallet ${metadata.wallet_id}`
  );
}

async function handleDirectPayment(
  metadata: any,
  amount: number,
  reference: string
) {
  console.log("Processing direct payment for order:", metadata.orderId);

  // Update order status to paid
  const { error: orderError } = await supabase
    .from("orders")
    .update({
      payment_status: "Paid",
      reference: reference,
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", metadata.orderId)
    .eq("user_id", metadata.user_id);

  if (orderError) throw orderError;

  // Send order confirmation emails to admin and user
  try {
    const emailRes = await axios.post(
      `${process.env.NEXT_PUBLIC_SITE_URL!}/api/email/send-order-confirmation`,
      {
        adminEmail: "orders.feedmeafrica@gmail.com",
        userEmail: metadata.userEmail,
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
          totalAmount: metadata.subtotal,
          totalAmountPaid: metadata.totalAmountPaid,
          userid: metadata.user_id,
        },
      }
    );

    const emailData = emailRes.data;
    console.log("Order confirmation email response:", emailData);

    if (emailData.success) {
      console.log("Order confirmation email sent successfully!");
    } else {
      console.error("Failed to send confirmation email:", emailData.error);
    }
  } catch (err) {
    console.error("Failed to send confirmation email:", err);
  }

  console.log(`Order ${metadata.orderId} marked as paid and processed`);
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
