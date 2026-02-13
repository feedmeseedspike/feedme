import { NextResponse } from "next/server";
import { authMiddleware } from "middleware/auth";
import { fetchUserOrders } from "@/queries/orders";

export const dynamic = 'force-dynamic';

export const GET = authMiddleware(async (request: Request, user_id: string) => {
  try {
    const user = await fetchUserOrders(user_id);
    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
});
