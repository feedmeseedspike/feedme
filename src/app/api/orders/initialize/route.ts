export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import paystack from "../../../../utils/paystack";
import { authMiddleware } from "middleware/auth";
import { supabase } from "src/lib/supabaseClient";

export const POST = authMiddleware(
  async (request: Request, user_id: string) => {
    try {
      const { email, amount, orderDetails } = await request.json();

      if (!email || !amount || !orderDetails) {
        return NextResponse.json(
          { message: "Missing required fields" },
          { status: 400 }
        );
      }

      // Initialize Paystack transaction
      const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL!}/order/order-confirmation`;
      const transactionData = await paystack.initializeTransaction({
        email,
        amount,
        callback_url: callbackUrl,
        metadata: { user_id, ...orderDetails },
      });

      // Save pending order/transaction
      const { error: txError } = await supabase.from("orders").insert({
        user_id,
        transaction_id: transactionData.data.reference,
        amount,
        currency: "NGN",
        payment_status: "pending",
        reference: transactionData.data.reference,
        ...orderDetails,
      });
      if (txError) throw txError;

      // Fetch the order just created
      const { data: order, error: orderFetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("reference", transactionData.data.reference)
        .single();
      if (orderFetchError || !order) throw orderFetchError;

      // Fetch order items
      const { data: orderItems, error: orderItemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);
      if (orderItemsError) throw orderItemsError;

      // Fetch product and bundle names
      const productIds = orderItems.filter(i => i.product_id).map(i => i.product_id);
      const bundleIds = orderItems.filter(i => i.bundle_id).map(i => i.bundle_id);

      const { data: products } = await supabase
        .from("products")
        .select("id, name")
        .in("id", productIds.length ? productIds : ["dummy"]);

      const { data: bundles } = await supabase
        .from("bundles")
        .select("id, name")
        .in("id", bundleIds.length ? bundleIds : ["dummy"]);

      const itemsOrdered = orderItems.map(item => {
        let title = "";
        if (item.product_id) {
          title = products?.find(p => p.id === item.product_id)?.name || "Product";
        } else if (item.bundle_id) {
          title = bundles?.find(b => b.id === item.bundle_id)?.name || "Bundle";
        }
        return {
          title,
          price: item.price || 0,
          quantity: item.quantity,
        };
      });

      // Parse shipping address
      const shipping = typeof order.shipping_address === "string"
        ? JSON.parse(order.shipping_address)
        : order.shipping_address;

      // Prepare email fields
      const orderNumber = order.reference || order.id;
      const customerName = shipping?.fullName || "";
      const customerPhone = shipping?.phone || "";
      const deliveryAddress = shipping?.street || "";
      const localGovernment = order.local_government || "";
      const deliveryFee = order.delivery_fee || 0;
      const totalAmount = order.total_amount || 0;
      const totalAmountPaid = order.total_amount_paid || 0;
      const serviceCharge = 0; // Set this as needed

      // Send order confirmation emails (admin and customer)
      try {
        // Send to admin
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/email/send-order-confirmation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "admin",
            to: process.env.ADMIN_ORDER_EMAIL || process.env.NODEMAILER_USER || "admin@yourdomain.com",
            subject: "Order Confirmation From FeedMe",
            orderProps: {
              orderNumber,
              customerName,
              customerPhone,
              itemsOrdered,
              deliveryAddress,
              localGovernment,
            },
          }),
        });
        // Send to customer
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/email/send-order-confirmation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "customer",
            to: email,
            subject: "Order Confirmation From FeedMe",
            orderProps: {
              orderNumber,
              customerName,
              customerPhone,
              itemsOrdered,
              deliveryAddress,
              deliveryFee,
              serviceCharge,
              totalAmount,
              totalAmountPaid,
            },
          }),
        });
      } catch (emailError) {
        console.error("Order confirmation email error:", emailError);
      }

      return NextResponse.json({
        access_code: transactionData.data.access_code,
        authorization_url: transactionData.data.authorization_url,
        reference: transactionData.data.reference,
      });
    } catch (error: any) {
      console.error(error);
      return NextResponse.json(
        { message: "Server error", error: error.message },
        { status: 500 }
      );
    }
  }
); 