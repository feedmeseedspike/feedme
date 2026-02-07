export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import paystack from "../../../../utils/paystack";
// import { authMiddleware } from "middleware/auth";
import { supabase as supabaseAdmin } from "src/lib/supabaseClient";
import { createClient } from "@/utils/supabase/server";
import { getRandomOrderNumber } from "@/utils/generator";

export const POST = async (request: Request) => {
    // Manually handle auth or lack thereof
    const supabase = await createClient(); 
    const { data: { user } } = await supabase.auth.getUser();
    const authUserId = user?.id;

    try {
      const { email: requestEmail, amount, orderDetails } = await request.json();
      if (amount === undefined || amount === null || !orderDetails) {
        return NextResponse.json(
          { message: "Missing required fields: amount and orderDetails are required." },
          { status: 400 }
        );
      }
      
      const emailFromAuth = user?.email;
      const finalEmail = requestEmail || emailFromAuth || orderDetails.shippingAddress?.email;

      if (!finalEmail) {
        return NextResponse.json(
          { message: "An email address is required to process your order." },
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
          reference: orderid,
          note: orderDetails.note,
        })
        .select()
        .single();
      if (txError || !order) throw txError;

      // Pre-fetch item names to ensure they are saved permanently in the option field
      const productIds = (orderDetails.cartItems || []).map((i: any) => i.productId).filter(Boolean);
      const bundleIds = (orderDetails.cartItems || []).map((i: any) => i.bundleId).filter(Boolean);
      const offerIds = (orderDetails.cartItems || []).map((i: any) => i.offerId).filter(Boolean);

      const [{ data: products }, { data: bundles }, { data: offers }] = await Promise.all([
        supabase.from("products").select("id, name").in("id", productIds),
        supabase.from("bundles").select("id, name").in("id", bundleIds),
        supabase.from("offers").select("id, title").in("id", offerIds),
      ]);

      // Insert order items
      const orderItemsToInsert = (orderDetails.cartItems || []).map((item: any) => {
        const matchingProduct = products?.find((p) => p.id === item.productId);
        const matchingBundle = bundles?.find((b) => b.id === item.bundleId);
        const matchingOffer = offers?.find((o) => o.id === item.offerId);
        const itemName = matchingProduct?.name || matchingBundle?.name || matchingOffer?.title || "";

        return {
          order_id: order.id,
          product_id: item.productId || null,
          bundle_id: item.bundleId || null,
          offer_id: item.offerId || null,
          quantity: item.quantity,
          price: item.price,
          option: item.option ? { ...item.option, _title: itemName } : { _title: itemName },
        };
      });
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
          orderId: order.id,
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
