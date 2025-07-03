import { NextResponse } from "next/server";
import paystack from "../../../../utils/paystack";
import { authMiddleware } from "middleware/auth";
import { supabase } from "src/lib/supabaseClient";

export const POST = authMiddleware(
  async (request: Request, user_id: string) => {
    try {
      const { email, amount, orderDetails } = await request.json();

      if (!email || !amount || !orderDetails) {
        return NextResponse.json(
          { message: "Missing required fields" },
          { status: 400 }
        );
      }

      // Initialize Paystack transaction
      const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL!}/order/order-confirmation`;
      const transactionData = await paystack.initializeTransaction({
        email,
        amount,
        callback_url: callbackUrl,
        metadata: { user_id, ...orderDetails },
      });

      // Save pending order/transaction
      const { error: txError } = await supabase.from("orders").insert({
        user_id,
        transaction_id: transactionData.data.reference,
        amount,
        currency: "NGN",
        payment_status: "pending",
        reference: transactionData.data.reference,
        ...orderDetails,
      });
      if (txError) throw txError;

      return NextResponse.json({
        access_code: transactionData.data.access_code,
        authorization_url: transactionData.data.authorization_url,
        reference: transactionData.data.reference,
      });
    } catch (error: any) {
      console.error(error);
      return NextResponse.json(
        { message: "Server error", error: error.message },
        { status: 500 }
      );
    }
  }
); 