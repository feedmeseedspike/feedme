import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "src/lib/supabaseClient";

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
      const { reference, amount, metadata } = body.data;

      // Update transaction
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .update({ payment_status: "successful" })
        .eq("reference", reference)
        .eq("user_id", metadata.user_id)
        .select()
        .single();
      if (txError) throw txError;

      if (transaction) {
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
      }
    }

    return NextResponse.json({ message: "Webhook processed" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
