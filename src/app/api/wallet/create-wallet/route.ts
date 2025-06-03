import { NextResponse } from "next/server";
import { supabase } from "src/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    // Extract and validate JWT
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header missing" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Check if wallet exists
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (walletError && walletError.code !== "PGRST116") {
      throw new Error(`Wallet query failed: ${walletError.message}`);
    }

    if (wallet) {
      return NextResponse.json(
        { message: "Wallet already exists", wallet },
        { status: 200 }
      );
    }

    // Create wallet
    const { data: newWallet, error: insertError } = await supabase
      .from("wallets")
      .insert({ user_id: user.id, balance: 0, currency: "NGN" })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Wallet creation failed: ${insertError.message}`);
    }

    return NextResponse.json(
      { message: "Wallet created successfully", wallet: newWallet },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create Wallet Error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details,
    });
    return NextResponse.json(
      {
        message: "Server error",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
        code: error.code || "UNKNOWN",
      },
      { status: 500 }
    );
  }
}
