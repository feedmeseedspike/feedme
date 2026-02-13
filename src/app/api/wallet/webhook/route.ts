import { NextResponse } from "next/server";
import crypto from "crypto";
import supabaseAdmin from "src/utils/supabase/admin"; // Use admin client to bypass RLS
import { sendUnifiedNotification } from "src/lib/actions/notifications.actions";

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
      const { data: transaction, error: txError } = await supabaseAdmin
        .from("transactions")
        .update({ payment_status: "paid" })
        .eq("reference", reference)
        .select()
        .maybeSingle();

      if (txError) {
          console.error("Error updating transaction status:", txError);
      }

      // Handle based on payment type
      if (metadata.type === "wallet_funding") {
          await handleWalletFunding(metadata, amount);
      } else if (metadata.type === "direct_payment") {
          await handleDirectPayment(metadata, amount, reference);
      }

      // Send push notification if user exists
      if (metadata.user_id) {
        let title = "Payment Successful";
        let body = `Your transaction for N${amount / 100} was successful.`;
        let link = "/account/wallet";
        
        if (metadata.type === "wallet_funding") {
          title = "Wallet Funded";
          body = `Your wallet has been funded with N${amount / 100}.`;
        } else if (metadata.type === "direct_payment") {
          title = "Order Confirmed";
          body = `Your order #${metadata.orderId} for N${amount / 100} has been confirmed!`;
          link = `/order/order-confirmation?id=${metadata.orderId}`;
        }

        try {
          await sendUnifiedNotification({
            userId: metadata.user_id,
            type: "info",
            title,
            body,
            link
          });
        } catch (err) {
          console.warn("Webhook notification failed:", err);
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
  const { data: wallet, error: fetchError } = await supabaseAdmin
    .from("wallets")
    .select("balance")
    .eq("id", metadata.wallet_id)
    .single();

  if (fetchError || !wallet) throw new Error("Wallet not found");

  const newBalance = wallet.balance + amount / 100;
  const { error: walletError } = await supabaseAdmin
    .from("wallets")
    .update({ balance: newBalance })
    .eq("id", metadata.wallet_id);

  if (walletError) throw walletError;

  // Send admin email notification
  try {
      const { sendWalletFundingEmail } = await import("@/utils/email/sendOrderEmail");
      await sendWalletFundingEmail({
          adminEmail: "orders.feedmeafrica@gmail.com",
          userName: metadata.customerName || "Customer",
          userEmail: metadata.email || "N/A",
          amount: amount / 100,
      });
  } catch (err) {
      console.error("Failed to send wallet funding email to admin:", err);
  }
}

async function handleDirectPayment(
  metadata: any,
  amount: number,
  reference: string
) {
  // 1. Idempotency Check: Fetch current order status
  const { data: existingOrder, error: fetchError } = await supabaseAdmin
    .from("orders")
    .select("payment_status")
    .eq("id", metadata.orderId)
    .maybeSingle();

  if (fetchError) {
      console.error("Error fetching order for idempotency check:", fetchError);
  } else if (existingOrder && existingOrder.payment_status === "Paid") {
      console.log(`Order ${metadata.orderId} is already Paid. Skipping processing.`);
      return;
  }

  // Update order status to paid
  const { error: orderError } = await supabaseAdmin
    .from("orders")
    .update({
      payment_status: "Paid",
      reference: reference,
      updated_at: new Date().toISOString(),
    })
    .eq("id", metadata.orderId);

  if (orderError) throw orderError;

  // --- REWARDS LOGIC (Shared Action) ---
  let bonusInfo: any = null;
  if (metadata.user_id) {
    try {
        const { processOrderRewards } = await import("src/lib/actions/rewards.actions");
        const rewardsResult = await processOrderRewards(
            metadata.user_id,
            metadata.orderId,
            amount / 100, // Convert Kobo to Naira
            metadata.itemsOrdered || []
        );
        
        if (rewardsResult.success) {
            bonusInfo = rewardsResult.rewards;
        }
    } catch (e) {
        console.error("Failed to process rewards in webhook:", e);
    }
  }

    // Send order confirmation emails
    try {
        console.log("Sending email via helper function directly");
        const { sendOrderConfirmationEmails } = await import("@/utils/email/sendOrderEmail");

        await sendOrderConfirmationEmails({
            adminEmail: "orders.feedmeafrica@gmail.com",
            userEmail: metadata.email,
            adminOrderProps: {
                orderNumber: metadata.orderId,
                customerName: metadata.customerName,
                customerPhone: metadata.customerPhone,
                itemsOrdered: metadata.itemsOrdered,
                deliveryAddress: metadata.deliveryAddress,
                localGovernment: metadata.localGovernment,
                orderNote: metadata.orderNote,
                paymentMethod: 'PAYSTACK',
                rewards: bonusInfo,
                totalAmount: metadata.amount,
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
                totalAmountPaid: metadata.amount,
                userid: metadata.user_id,
            },
        });

        console.log("Email processed successfully via helper");
    } catch (err: any) {
        console.error("Failed to send confirmation email via helper:", err.message);
    }
}
