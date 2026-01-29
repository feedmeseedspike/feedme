import { NextResponse } from "next/server";
import paystack from "../../../../utils/paystack";
import { authMiddleware } from "middleware/auth";
import { supabase } from "src/lib/supabaseClient";

export const POST = authMiddleware(
  async (request: Request, user_id: string) => {
    try {
      const { reference } = await request.json();

      if (!reference) {
        return NextResponse.json(
          { message: "Reference is required" },
          { status: 400 }
        );
      }

      // Verify transaction with Paystack
      const verification = await paystack.verifyTransaction(reference);
      const { status, amount, metadata } = verification.data;
      const metd = metadata as { user_id: string; wallet_id: string };
      const amt = amount as number;
      if (status !== "success") {
        return NextResponse.json(
          { message: "Transaction not successful" },
          { status: 400 }
        );
      }

      // Verify transaction belongs to user
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .update({ payment_status: "paid" })
        .eq("reference", reference)
        .eq("user_id", user_id)
        .select()
        .single();
      if (txError || !transaction) {
        return NextResponse.json(
          { message: "Transaction not found or unauthorized" },
          { status: 404 }
        );
      }

      // Update wallet balance
      const { data: wallet, error: fetchError } = await supabase
        .from("wallets")
        .select("balance")
        .eq("id", metd.wallet_id)
        .eq("user_id", user_id)
        .single();
      if (fetchError || !wallet) throw new Error("Wallet not found");

      const newBalance = wallet.balance + amt / 100;
      const { error: walletError } = await supabase
        .from("wallets")
        .update({ balance: newBalance })
        .eq("id", metd.wallet_id);
      if (walletError) throw walletError;

      return NextResponse.json({
        message: "Transaction verified and wallet updated",
        transaction,
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
