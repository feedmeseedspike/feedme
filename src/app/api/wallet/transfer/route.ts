import { NextResponse } from "next/server";
import paystack from "../../../../utils/paystack";
import { authMiddleware } from "middleware/auth";
import { supabase } from "src/lib/supabaseClient";

export const POST = authMiddleware(
  async (request: Request, user_id: string) => {
    try {
      const { amount, account_number, bank_code, recipient_name } =
        await request.json();

      if (!amount || !account_number || !bank_code || !recipient_name) {
        return NextResponse.json(
          { message: "Missing required fields" },
          { status: 400 }
        );
      }

      // Check wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user_id)
        .single();
      if (walletError || !wallet) {
        return NextResponse.json(
          { message: "Wallet not found" },
          { status: 404 }
        );
      }
      if (wallet.balance < amount) {
        return NextResponse.json(
          { message: "Insufficient balance" },
          { status: 400 }
        );
      }

      // Resolve bank account
      const accountDetails = await paystack.resolveBankAccount({
        account_number,
        bank_code,
      });
      if (!accountDetails.status) {
        return NextResponse.json(
          { message: "Invalid bank account" },
          { status: 400 }
        );
      }

      // Check if recipient exists
      let { data: recipient, error: recipientError } = await supabase
        .from("recipients")
        .select("recipient_code")
        .eq("user_id", user_id)
        .eq("account_number", account_number)
        .eq("bank_code", bank_code)
        .single();

      let recipientCode: string;
      if (!recipient || recipientError) {
        // Create new Paystack recipient
        const recipientData = await paystack.createRecipient({
          name: recipient_name,
          account_number,
          bank_code,
          currency: "NGN",
        });
        if (!recipientData.status) {
          return NextResponse.json(
            { message: "Recipient creation failed" },
            { status: 400 }
          );
        }
        recipientCode = recipientData.data.recipient_code!;

        // Save recipient to Supabase
        const { error: insertError } = await supabase
          .from("recipients")
          .insert({
            user_id,
            account_number,
            bank_code,
            recipient_name,
            recipient_code: recipientCode,
          });
        if (insertError) throw insertError;
      } else {
        recipientCode = recipient.recipient_code;
      }

      // Initiate transfer
      const transferData = await paystack.initiateTransfer({
        amount,
        recipient: recipientCode,
        reason: "Wallet withdrawal",
      });

      if (!transferData.status) {
        return NextResponse.json(
          { message: "Transfer initiation failed" },
          { status: 400 }
        );
      }

      // Deduct from wallet balance
      const newBalance = wallet.balance - amount;
      const { error: updateError } = await supabase
        .from("wallets")
        .update({ balance: newBalance })
        .eq("id", wallet.id);
      if (updateError) throw updateError;

      // Record transaction
      const { error: txError } = await supabase.from("transactions").insert({
        user_id,
        wallet_id: wallet.id,
        transaction_id: transferData.data.reference,
        amount,
        currency: "NGN",
        payment_status: "paid",
        reference: transferData.data.reference,
      });
      if (txError) throw txError;

      return NextResponse.json({
        message: "Transfer successful",
        transfer: transferData.data,
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
