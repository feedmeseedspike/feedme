import { NextResponse } from "next/server";
import supabaseAdmin from "src/utils/supabase/admin";
import { fetchOrderById } from "@/queries/orders";

export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    
    // First, verify the order exists and is actually a gift
    const order = await fetchOrderById(orderId);
    
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const shippingAddress = order.shipping_address as any;
    
    if (!shippingAddress?.isGiftLink && shippingAddress?.street !== "Pending Gift Claim") {
       return NextResponse.json({ error: "This order is not a pending gift or has already been claimed." }, { status: 400 });
    }

    const body = await request.json();
    const { fullName, phone, street, location } = body;

    if (!fullName || !phone || !street || !location) {
        return NextResponse.json({ error: "Missing required delivery fields." }, { status: 400 });
    }

    // Prepare updated shipping address
    // We preserve senderName and giftMessage so it's still available on the order
    const updatedShippingAddress = {
        ...shippingAddress,
        isGiftLink: false, // Mark as claimed
        fullName,
        phone,
        street,
        location
    };

    // Update the record
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
         shipping_address: updatedShippingAddress,
         local_government: location, // Update standard LGA field for analytics/delivery
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order:", updateError);
      return NextResponse.json(
        { error: "Failed to update the order with delivery details" },
        { status: 500 }
      );
    }

    // (Optional) Send an email to the sender letting them know the gift was claimed
    if (shippingAddress.email) {
       try {
           fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/email/send-order-confirmation`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                 adminEmail: "orders.feedmeafrica@gmail.com",
                 userEmail: shippingAddress.email,
                 isGiftClaimNotice: true,
                 adminOrderProps: {
                    orderNumber: order.reference || orderId,
                    customerName: fullName, // recipient
                    customerPhone: phone,
                    itemsOrdered: [],
                    subtotal: 0,
                    deliveryFee: 0,
                    discount: 0,
                    totalAmount: order.total_amount_paid,
                    deliveryAddress: `${street}, ${location}`
                 }
              })
           }).catch(e => console.error("Failed to trigger gift claim notice email:", e));
       } catch (e) {
           console.error("Gift claim email error:", e);
       }
    }

    return NextResponse.json({ 
        success: true, 
        message: "Gift claimed successfully." 
    });

  } catch (error: any) {
    console.error("Error in claim-gift API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
