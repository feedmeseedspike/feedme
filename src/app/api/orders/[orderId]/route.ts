import { NextResponse } from "next/server";
import { fetchOrderById } from "@/queries/orders";

export async function GET(req: Request, { params }: { params: { orderId: string } }) {
  try {
    const order = await fetchOrderById(params.orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // SECURITY: Filter order object to only expose what the recipient needs
    const shippingAddress = order.shipping_address as any;
    
    // If it's already claimed and not by this specific view? 
    // Actually, the client handles the "already claimed" state, but we should restrict the data.
    
    const sanitizedOrder = {
      id: order.id,
      status: order.status,
      shipping_address: {
        senderName: shippingAddress?.senderName || order.profiles?.display_name || "Someone",
        giftMessage: shippingAddress?.giftMessage || "",
        isGiftLink: shippingAddress?.isGiftLink ?? false,
      },
      order_items: order.order_items || [],
      // DO NOT include payment_status, total_amount, user_id, etc.
    };

    return NextResponse.json(sanitizedOrder);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch order" }, { status: 500 });
  }
} 