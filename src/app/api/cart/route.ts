import { NextResponse } from "next/server";
import { authMiddleware } from "middleware/auth";
import {
  addToCart,
  clearCart,
  getCart,
  ItemToUpdate,
  updateCartItems,
} from "@/lib/actions/cart.actions";
import { Tables } from "@/utils/database.types";

export const GET = authMiddleware(async () => {
  try {
    const cart = await getCart();
    return NextResponse.json(cart);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
});

export const PUT = authMiddleware(async (request: Request, user_id: string) => {
  const { items }: { items: ItemToUpdate[] } = await request.json();
  try {
    const cart = await updateCartItems(items);
    return NextResponse.json(cart);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
});

export const POST = authMiddleware(
  async (request: Request, user_id: string) => {
    const {
      productId,
      quantity,
      selectedOption,
      bundleId,offerId
    }: {
      productId: string | null;
      quantity: number;
      selectedOption?: any;
      bundleId?: string | null;offerId?:string|null
    } = await request.json();
    try {
      const cart = await addToCart(
        productId,
        quantity,
        selectedOption,
        bundleId,offerId
      );
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

export const DELETE = authMiddleware(
  async (request: Request, user_id: string) => {
    try {
      const cart = await clearCart();
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
