export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import paystack from "../../../../utils/paystack";
import { authMiddleware } from "middleware/auth";
import { supabase } from "src/lib/supabaseClient";
import { getRandomOrderNumber } from "@/utils/generator";

export const POST = authMiddleware(
  async (request: Request, user_id: string) => {
    try {
      const { email, amount, orderDetails } = await request.json();

      if (!email || !amount || !orderDetails) {
        console.log({ email, amount, orderDetails });
        return NextResponse.json(
          { message: "Missing required fields" },
          { status: 400 }
        );
      }
      const orderid = getRandomOrderNumber();

      const reference = {
        reference: orderid,
        user_id,
        order_id: orderid,
      };

      const { error: rfError } = await supabase
        .from("reference")
        .insert(reference);

      if (rfError) {
        console.error("Failed to save reference:", rfError);
        throw new Error(`Failed to save transaction: ${rfError.message}`);
      }

      // Initialize Paystack transaction
      // const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL!}/order/order-confirmation`;
      // const transactionData = await paystack.initializeTransaction({
      //   email,
      //   amount,
      //   callback_url: callbackUrl,
      //   metadata: { user_id, ...orderDetails },
      // });

      // Ensure user_id exists in profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", user_id)
        .single();
      if (profileError || !profile) {
        console.log({ profileError });
        return NextResponse.json(
          { message: "User profile not found for order creation." },
          { status: 400 }
        );
      }
      // Save pending order/transaction and get the inserted order
      const { data: order, error: txError } = await supabase
        .from("orders")
        .insert({
          user_id: profile.user_id,
          total_amount: amount,
          total_amount_paid: orderDetails.totalAmountPaid,
          delivery_fee: orderDetails.deliveryFee,
          local_government: orderDetails.local_government,
          voucher_id: orderDetails.voucherId,
          payment_method: orderDetails.paymentMethod,
          shipping_address: orderDetails.shippingAddress,
          payment_status: "Pending",
          order_id: orderid,
        })
        .select()
        .single();
      if (txError || !order) throw txError;

      // Insert order items
      const orderItemsToInsert = (orderDetails.cartItems || []).map((item: any) => ({
        order_id: order.id,
        product_id: item.productId || null,
        bundle_id: item.bundleId || null,
        quantity: item.quantity,
        price: item.price,
        option: item.option || null,
      }));
      if (orderItemsToInsert.length > 0) {
        const { error: orderItemsError } = await supabase
          .from("order_items")
          .insert(orderItemsToInsert);
        if (orderItemsError) throw orderItemsError;
      }

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
          title =
            products?.find((p) => p.id === item.product_id)?.name || "Product";
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
      const shipping =
        typeof order.shipping_address === "string"
          ? JSON.parse(order.shipping_address)
          : order.shipping_address;

      // Prepare email fields
      const orderNumber = order.id;
      const customerName = shipping?.fullName || "";
      const customerPhone = shipping?.phone || "";
      const deliveryAddress = shipping?.street || "";
      const localGovernment = order.local_government || "";
      const deliveryFee = order.delivery_fee || 0;
      const totalAmount = order.total_amount || 0;
      const totalAmountPaid = order.total_amount_paid || 0;
      const serviceCharge = 0;


      return NextResponse.json({
        success: true,
        data: {
          orderId: orderid,
        },
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
