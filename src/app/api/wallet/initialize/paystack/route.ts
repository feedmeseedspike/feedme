import { supabase } from "@/lib/supabaseClient";
import paystack from "@/utils/paystack";
import { authMiddleware } from "middleware/auth";
import { NextResponse } from "next/server";

export const POST = authMiddleware(
  async (request: Request, user_id: string) => {
    try {
      const { email, amount, orderId } = await request.json();

      // Validate input
      if (!email || !amount || !orderId) {
        return NextResponse.json(
          { message: "Missing required fields: email, amount, and orderId" },
          { status: 400 }
        );
      }

      if (typeof amount !== "number" || amount <= 0) {
        return NextResponse.json(
          { message: "Amount must be a positive number" },
          { status: 400 }
        );
      }

      // Initialize Paystack transaction
      const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL!}/order/order-confirmation?orderId=${orderId}`;
      const transactionData = await paystack.initializeTransaction({
        email,
        amount,
        callback_url: callbackUrl,
        metadata: { user_id, orderId },
      });

      const { error: txError } = await supabase.from("transactions").insert({
        user_id,
        transaction_id: transactionData.data.reference,
        amount,
        currency: "NGN",
        payment_status: "pending",
        reference: transactionData.data.reference,
      });

      if (txError) {
        throw new Error(`Failed to save transaction: ${txError.message}`);
      }

      return NextResponse.json({
        access_code: transactionData.data.access_code,
        authorization_url: transactionData.data.authorization_url,
        reference: transactionData.data.reference,
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
