import { NextResponse } from "next/server";
import { fetchOrderById } from "@/queries/orders";
import { createClient } from "src/utils/supabase/server";

export async function GET(req: Request, { params }: { params: { orderId: string } }) {
  try {
    const order = await fetchOrderById(params.orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check query parameters to see if we need to verify a Paystack reference on the fly
    const url = new URL(req.url);
    const reference = url.searchParams.get("reference");

    if (reference && order.payment_status !== "Paid" && order.payment_status !== "paid") {
      try {
        const { default: paystack } = await import("src/utils/paystack");
        const paystackVerify = await paystack.verifyTransaction(reference);
        if (paystackVerify.data && paystackVerify.data.status === "success") {
          const paystackOrderId = paystackVerify.data.metadata?.orderId;
          if (paystackOrderId === params.orderId) {
            // Update order status to Paid
            const { error: updateError } = await supabase
              .from("orders")
              .update({
                payment_status: "Paid",
                reference: reference,
                updated_at: new Date().toISOString(),
              })
              .eq("id", params.orderId);

            if (!updateError) {
              order.payment_status = "Paid";
              order.reference = reference;

              // Process rewards and points
              try {
                const { processOrderRewards } = await import("src/lib/actions/rewards.actions");
                await processOrderRewards(
                  order.user_id,
                  order.id,
                  paystackVerify.data.amount ? (paystackVerify.data.amount / 100) : 0,
                  order.order_items || []
                );
              } catch (rewardsErr) {
                console.error("Failed to process rewards during fallback verification:", rewardsErr);
              }
            }
          }
        }
      } catch (verifyErr) {
        console.error("Failed to verify transaction on the fly:", verifyErr);
      }
    }

    // Return the full order details. Gift feature is commented out for now.
    return NextResponse.json(order);

    /*
    const isGiftLink = shippingAddress?.isGiftLink ?? false;
    const isOwner = user && order.user_id && user.id === order.user_id;

    // Check query parameters to see if caller is specified
    const url = new URL(req.url);
    const caller = url.searchParams.get("caller");

    // If it's not a gift link, or the requester is the owner, or caller is specified as purchaser:
    // return the full order details.
    if (!isGiftLink || isOwner || caller === "purchaser") {
      return NextResponse.json(order);
    }

    // SECURITY: Filter order object to only expose what the recipient needs
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
    */
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch order" }, { status: 500 });
  }
} 