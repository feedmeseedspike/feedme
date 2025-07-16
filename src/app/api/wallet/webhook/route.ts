import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "src/lib/supabaseClient";
import axios from "axios";

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
      console.log({ reference, amount, metadata });

      // Update transaction status
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .update({ payment_status: "successful" })
        .eq("reference", reference)
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
          await handleDirectPayment(metadata, amount, reference);
        }
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
    .eq("id", metadata.orderId)
    .eq("user_id", metadata.user_id);

  if (orderError) throw orderError;

  // Handle referral voucher if applicable
  // if (metadata.autoAppliedReferralVoucher && metadata.user_id) {
  //   try {
  //     await fetch(`${process.env.NEXT_PUBLIC_SITE_URL!}/api/referral/status`, {
  //       method: "PATCH",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         userId: metadata.user_id,
  //         status: "qualified",
  //         referred_discount_given: true,
  //       }),
  //     });
  //     console.log("Referral status updated successfully");
  //   } catch (err) {
  //     console.error("Failed to update referral status after order:", err);
  //   }
  // }

  // Send order confirmation emails to admin and user
  try {
    const emailRes = await axios.post(
      process.env.NEXT_PUBLIC_SITE_URL!+ "/api/email/send-order-confirmation",
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
