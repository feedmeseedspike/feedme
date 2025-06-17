import { authMiddleware } from "middleware/auth";
import { NextResponse } from "next/server";
import { supabase } from "src/lib/supabaseClient";

export const GET = authMiddleware(async (request: Request, user_id: string) => {
  try {
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("balance, currency")
      .eq("user_id", user_id)
      .maybeSingle();
    if (walletError || !wallet) {
      return NextResponse.json(
        { message: "Wallet not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      balance: wallet.balance,
      currency: wallet.currency,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
});
