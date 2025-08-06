import { processWalletPayment } from "@/lib/actions/wallet.actions";
import { OrderData } from "@/utils/types";
import { authMiddleware } from "middleware/auth";
import { NextResponse } from "next/server";

export const POST = authMiddleware(
  async (request: Request, user_id: string) => {
    const { orderData }: { orderData: OrderData } = await request.json();
    if (!orderData) {
      return NextResponse.json({ message: "Bad request", status: 400 });
    }
    console.log('orderdata to be created => ', orderData)
    try {
      const wallet = await processWalletPayment(orderData);

      return NextResponse.json(wallet);
    } catch (error: any) {
      console.error(error);
      return NextResponse.json(
        { message: "Server error", error: error.message },
        { status: 500 }
      );
    }
  }
);
