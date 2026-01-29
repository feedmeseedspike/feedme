import { NextResponse } from "next/server";
import paystack from "../../../../utils/paystack";
import { authMiddleware } from "middleware/auth";
import { supabase } from "src/lib/supabaseClient";
import { createClient } from "@/utils/supabase/server";

export const POST = async (request: Request) => {
    // Manually handle auth
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    const user_id = user?.id || null;

    try {
      const {
        email: requestEmail,
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
        subtotal
      } = await request.json();

      const email = requestEmail || user?.email;

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
        if (!user_id) {
            return NextResponse.json(
                { message: "User must be logged in to fund wallet" },
                { status: 401 }
            );
        }

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
          email: email,
          customerName: customerName || email,
        };
      } else if (type === "direct_payment") {
        callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL!}/order/order-confirmation?orderId=${orderId}`;
        metadata = {
          type: "direct_payment",
          user_id: user_id, // Can be null for anonymous
          orderId,
          // Additional data for webhook processing
          email: email,
          amount: amount,
          autoAppliedReferralVoucher: autoAppliedReferralVoucher || false,
          customerName: customerName || "",
          customerPhone: customerPhone || "",
          itemsOrdered: itemsOrdered || [],
          deliveryAddress: deliveryAddress || "",
          localGovernment: localGovernment || "",
          deliveryFee: deliveryFee || 0,
          serviceCharge: serviceCharge || 0,
          subtotal: subtotal || amount,
        };
      } else {
        return NextResponse.json(
          {
            message:
              "Invalid payment type. Use 'wallet_funding' or 'direct_payment'",
          },
          { status: 400 }
        );
      }

      // Initialize Paystack transaction
      const transactionData = await paystack.initializeTransaction({
        email,
        amount,
        callback_url: callbackUrl,
        metadata,
      });

      // Save transaction with type-specific data
      // Only attempt to save transaction if we have a user_id.
      // Anonymous users trigger a unique constraint violation on the not-null user_id column.
      if (user_id) {
        const transactionRecord: any = {
          user_id: user_id, 
          transaction_id: transactionData.data.reference,
          amount,
          currency: "NGN",
          payment_status: "pending",
          reference: transactionData.data.reference,
          order_id: orderId || null,
        };

        // Add wallet_id for funding transactions
        if (type === "wallet_funding" && wallet) {
          transactionRecord.wallet_id = wallet.id;
        }

        const { error: txError } = await supabase
          .from("transactions")
          .insert(transactionRecord);

        if (txError) {
           // Log error but generally don't block flow if it's just tracking
           console.error("Failed to save transaction record:", txError);
        }
      } else {
        console.log("Anonymous payment initialized. Skipping 'transactions' table insert (requires user_id). Order state will be managed via orders table.");
      }



      return NextResponse.json({
        access_code: transactionData.data.access_code,
        authorization_url: transactionData.data.authorization_url,
        reference: orderId,
        type: type, // Return the type for frontend handling
      });
    } catch (error: any) {
      console.error("Payment initialization error:", error);
      return NextResponse.json(
        { message: "Server error", error: error.message },
        { status: 500 }
      );
    }
  };
