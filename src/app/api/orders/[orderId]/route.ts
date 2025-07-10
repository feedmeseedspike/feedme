import { NextResponse } from "next/server";
import { fetchOrderById } from "@/queries/orders";

export async function GET(req: Request, { params }: { params: { orderId: string } }) {
  try {
    const order = await fetchOrderById(params.orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch order" }, { status: 500 });
  }
} 