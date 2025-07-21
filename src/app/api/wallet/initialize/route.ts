import { NextResponse } from "next/server";
import paystack from "../../../../utils/paystack";
import { authMiddleware } from "middleware/auth";
import { supabase } from "src/lib/supabaseClient";

export const POST = authMiddleware(
  async (request: Request, user_id: string) => {
    try {
      console.log("Payment initialization started");
      const {
        email,
        amount,
        type,
        orderId,
        // Additional fields for direct payment
        autoAppliedReferralVoucher,
        customerName,
        customerPhone,
        itemsOrdered,
        deliveryAddress,
        localGovernment,
        deliveryFee,
        serviceCharge,
        subtotal,
      } = await request.json();

      console.log({ email, amount, type, orderId });

      // Validate common fields
      if (!email || !amount || !type) {
        return NextResponse.json(
          { message: "Missing required fields: email, amount, and type" },
          { status: 400 }
        );
      }

      if (typeof amount !== "number" || amount <= 0) {
        return NextResponse.json(
          { message: "Amount must be a positive number" },
          { status: 400 }
        );
      }

      // Validate type-specific fields
      if (type === "direct_payment" && !orderId) {
        return NextResponse.json(
          { message: "orderId is required for direct payments" },
          { status: 400 }
        );
      }

      let callbackUrl;
      let metadata;
      let wallet = null;

      // Handle different payment types
      if (type === "wallet_funding") {
        // Check or create wallet for funding
        let { data: existingWallet, error: walletError } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", user_id)
          .single();

        if (!existingWallet) {
          const { data: newWallet, error: insertError } = await supabase
            .from("wallets")
            .insert({ user_id, balance: 0, currency: "NGN" })
            .select()
            .single();
          if (insertError) throw insertError;
          wallet = newWallet;
        } else {
          wallet = existingWallet;
        }

        callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL!}/account/wallet/success`;
        metadata = {
          type: "wallet_funding",
          user_id,
          wallet_id: wallet.id,
        };
      } else if (type === "direct_payment") {
        callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL!}/order/order-confirmation?orderId=${orderId}`;
        metadata = {
          type: "direct_payment",
          user_id,
          orderId,
          // Additional data for webhook processing
          userEmail: email,
          autoAppliedReferralVoucher: autoAppliedReferralVoucher || false,
          customerName: customerName || "",
          customerPhone: customerPhone || "",
          itemsOrdered: itemsOrdered || [],
          deliveryAddress: deliveryAddress || "",
          localGovernment: localGovernment || "",
          deliveryFee: deliveryFee || 0,
          serviceCharge: serviceCharge || 0,
          subtotal: subtotal || amount,
          totalAmountPaid: amount,
        };

        // Update the order with pending status (we'll add reference after Paystack response)
        const { error: orderUpdateError } = await supabase
          .from("orders")
          .update({ payment_status: "Pending" })
          .eq("id", orderId);

        if (orderUpdateError) {
          console.error("Failed to update order status:", orderUpdateError);
        }
      } else {
        return NextResponse.json(
          {
            message:
              "Invalid payment type. Use 'wallet_funding' or 'direct_payment'",
          },
          { status: 400 }
        );
      }

      // Debug: Check if Paystack secret key is present
      console.log(
        "Paystack Secret Key present:",
        !!process.env.PAYSTACK_SECRET_KEY
      );

      // Initialize Paystack transaction
      const transactionData = await paystack.initializeTransaction({
        email,
        amount,
        callback_url: callbackUrl,
        metadata,
      });

      // Save transaction with type-specific data
      const transactionRecord:any = {
        user_id,
        transaction_id: transactionData.data.reference,
        amount,
        currency: "NGN",
        payment_status: "pending",
        reference: transactionData.data.reference,
      };

      // Add wallet_id for funding transactions
      if (type === "wallet_funding" && wallet) {
        transactionRecord.wallet_id = wallet.id;
      }

      const { error: txError } = await supabase
        .from("transactions")
        .insert(transactionRecord);

      if (txError) {
        throw new Error(`Failed to save transaction: ${txError.message}`);
      }

      // Update order with Paystack reference for direct payments
      if (type === "direct_payment") {
        const { error: orderUpdateError } = await supabase
          .from("orders")
          .update({ reference: transactionData.data.reference })
          .eq("id", orderId);

        if (orderUpdateError) {
          console.error(
            "Failed to update order with Paystack reference:",
            orderUpdateError
          );
        }
      }

      return NextResponse.json({
        access_code: transactionData.data.access_code,
        authorization_url: transactionData.data.authorization_url,
        reference: transactionData.data.reference,
        type: type, // Return the type for frontend handling
      });
    } catch (error: any) {
      console.error("Payment initialization error:", error);
      return NextResponse.json(
        { message: "Server error", error: error.message },
        { status: 500 }
      );
    }
  }
);
