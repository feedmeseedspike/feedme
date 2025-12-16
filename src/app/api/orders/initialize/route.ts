export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabase as supabaseAdmin } from "src/lib/supabaseClient";
import { createClient } from "@/utils/supabase/server";
import { getRandomOrderNumber } from "@/utils/generator";

export const POST = async (request: Request) => {
    // Manually handle auth or lack thereof
    const supabase = await createClient(); 
    const { data: { user } } = await supabase.auth.getUser();
    const authUserId = user?.id;

    try {
      const { email, amount, orderDetails } = await request.json();

      if (!email || !amount || !orderDetails) {
        return NextResponse.json(
          { message: "Missing required fields" },
          { status: 400 }
        );
      }
      
      const userIdToUse = authUserId || orderDetails.userId || null;
      
      const orderid = getRandomOrderNumber();

      const reference = {
        reference: orderid,
        user_id: userIdToUse, // Can be null
        order_id: orderid,
      };

      if (userIdToUse) {
          const { error: rfError } = await supabase
            .from("reference")
            .insert(reference);

          if (rfError) {
            console.error("Failed to save reference:", rfError);
            // Non-critical for flow, but let's log it.
            // If strict consistency is needed, we might throw, but for guest flow we proceed.
          }
      }

      // Check profile if user exists
      let profileUserId = null;
      if (userIdToUse) {
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("user_id", userIdToUse)
            .single();
        if (profile) {
            profileUserId = profile.user_id;
        }
      }

      // Save pending order/transaction and get the inserted order
      const { data: order, error: txError } = await supabase
        .from("orders")
        .insert({
          user_id: profileUserId, // Nullable
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

      // Fetch order items (reuse existing logic)
      const { data: orderItems, error: orderItemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);
      if (orderItemsError) throw orderItemsError;

      // ... keep existing response helpers logic ...
      // But we don't strictly need to reconstruct the itemsOrdered response if frontend doesn't use all of it immediately.
      // The frontend uses `result.data.orderId`.
      
      // Let's keep it simple and return success
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
  };
