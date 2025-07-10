import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "src/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    // Verify Paystack webhook signature
    const body = await request.json();
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY as string)
      .update(JSON.stringify(body))
      .digest("hex");

    if (hash !== request.headers.get("x-paystack-signature")) {
      return NextResponse.json(
        { message: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    if (body.event === "charge.success") {
      const { reference, amount, metadata } = body.data;

      // Update transaction
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .update({ payment_status: "successful" })
        .eq("reference", reference)
        .eq("user_id", metadata.user_id)
        .select()
        .single();
      if (txError) throw txError;

      // Update order status to 'Paid' and 'order confirmed'
      const { error: orderError } = await supabase
        .from("orders")
        .update({ payment_status: "Paid", status: "order confirmed" })
        .eq("reference", reference)
        .eq("user_id", metadata.user_id);
      if (orderError) throw orderError;

      // Fetch the order and items for email
      const { data: order, error: fetchOrderError } = await supabase
        .from("orders")
        .select(
          `*, order_items(*, products(name, images), bundles(name, thumbnail_url))`
        )
        .eq("reference", reference)
        .eq("user_id", metadata.user_id)
        .single();
      if (!order || fetchOrderError) {
        console.error("Webhook: Could not fetch order for email", fetchOrderError);
      } else {
        // Build email props
        const shipping = typeof order.shipping_address === "string"
          ? JSON.parse(order.shipping_address)
          : order.shipping_address;
        const itemsOrdered = (order.order_items || []).map((item: any) => ({
          title: item.products?.name || item.bundles?.name || "",
          price: item.price,
          quantity: item.quantity,
        }));
        const adminOrderProps = {
          orderNumber: order.reference || order.id,
          customerName: shipping?.fullName || "",
          customerPhone: shipping?.phone || "",
          itemsOrdered,
          deliveryAddress: shipping?.street || "",
          localGovernment: order.local_government || "",
        };
        const userOrderProps = {
          ...adminOrderProps,
          deliveryFee: order.delivery_fee || 0,
          serviceCharge: order.service_charge || 0,
          totalAmount: order.total_amount || 0,
          totalAmountPaid: order.total_amount_paid || 0,
        };
        try {
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send-order-confirmation`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              adminEmail: process.env.NODEMAILER_USER || "oyedeletopy.uk@gmail.com",
              userEmail: metadata.email,
              adminOrderProps,
              userOrderProps,
            }),
          });
        } catch (emailErr) {
          console.error("Webhook: Failed to send order confirmation email", emailErr);
        }
      }
    }
    // Handle failed payment
    if (body.event === "charge.failed") {
      const { reference, metadata } = body.data;
      await supabase
        .from("orders")
        .update({ payment_status: "cancelled", status: "order failed" })
        .eq("reference", reference)
        .eq("user_id", metadata.user_id);
      // Send notification email to user and admin
      const userEmail = metadata.email || (await supabase.from('profiles').select('email').eq('user_id', metadata.user_id).single()).data?.email;
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send-order-failed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: userEmail,
          subject: "Order Payment Failed",
          orderReference: reference,
          reason: "Payment failed",
        }),
      });
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send-order-failed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: process.env.NODEMAILER_USER || "oyedelejeremiah.ng@gmail.com",
          subject: "Order Payment Failed (Admin)",
          orderReference: reference,
          reason: "Payment failed",
        }),
      });
    }
    // Handle cancelled payment
    if (body.event === "charge.cancelled") {
      const { reference, metadata } = body.data;
      await supabase
        .from("orders")
        .update({ payment_status: "cancelled", status: "order cancelled" })
        .eq("reference", reference)
        .eq("user_id", metadata.user_id);
      // Send notification email to user and admin
      const userEmail = metadata.email || (await supabase.from('profiles').select('email').eq('user_id', metadata.user_id).single()).data?.email;
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send-order-failed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: userEmail,
          subject: "Order Payment Cancelled",
          orderReference: reference,
          reason: "Payment cancelled",
        }),
      });
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send-order-failed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: process.env.NODEMAILER_USER || "oyedelejeremiah.ng@gmail.com",
          subject: "Order Payment Cancelled (Admin)",
          orderReference: reference,
          reason: "Payment cancelled",
        }),
      });
    }

    return NextResponse.json({ message: "Webhook processed" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
