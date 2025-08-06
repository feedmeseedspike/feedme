import { NextResponse } from "next/server";
import { authMiddleware } from "middleware/auth";
import {
  removeFromCart,
  updateCartItemQuantity,
} from "@/lib/actions/cart.actions";

export const PATCH = authMiddleware(async (request: Request, user_id: string) => {
  const {
    cartid,
    quantity,
  }: {
    cartid: string;
    quantity: number;
  } = await request.json();
  try {
    const cart = await updateCartItemQuantity(cartid, quantity);
    return NextResponse.json(cart);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
});

export const DELETE = authMiddleware(
  async (request: Request, user_id: string) => {
    const { searchParams } = new URL(request.url);
    const cartid = searchParams.get("cartid") || "";
    console.log(cartid);
    if (!cartid) {
      return NextResponse.json({});
    }

    try {
      const cart = await removeFromCart(cartid);
      return NextResponse.json(cart);
    } catch (error: any) {
      console.error(error);
      return NextResponse.json(
        { message: "Server error", error: error.message },
        { status: 500 }
      );
    }
  }
);
