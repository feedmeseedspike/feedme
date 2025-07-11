import { NextResponse } from "next/server";
import paystack from "../../../../utils/paystack";
import { authMiddleware } from "middleware/auth";
import { supabase } from "src/lib/supabaseClient";

export const POST = authMiddleware(
  async (request: Request, user_id: string) => {
    try {
      console.log("started");
      const { email, amount } = await request.json();
      console.log(email, amount);
      if (!email || !amount) {
        return NextResponse.json(
          { message: "Missing required fields" },
          { status: 400 }
        );
      }

      // Check or create wallet
      let { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user_id)
        .single();

      console.log(user_id);

      if (!wallet) {
        const { data: newWallet, error: insertError } = await supabase
          .from("wallets")
          .insert({ user_id, balance: 0, currency: "NGN" })
          .select()
          .single();
        if (insertError) throw insertError;
        wallet = newWallet;
      }

      // Debug: Check if Paystack secret key is present
      console.log(
        "Paystack Secret Key present:",
        !!process.env.PAYSTACK_SECRET_KEY
      );
      console.log(
        "Paystack Secret Key value (first 5 chars):",
        process.env.PAYSTACK_SECRET_KEY?.slice(0, 5)
      );

      // Initialize Paystack transaction
      const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL!}/account/wallet/success`;
      const transactionData = await paystack.initializeTransaction({
        email,
        amount,
        callback_url: callbackUrl,
        metadata: { user_id, wallet_id: wallet.id },
      });

      // Save transaction
      const { error: txError } = await supabase.from("transactions").insert({
        user_id,
        wallet_id: wallet.id,
        transaction_id: transactionData.data.reference,
        amount,
        currency: "NGN",
        payment_status: "pending",
        reference: transactionData.data.reference,
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
