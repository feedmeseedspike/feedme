"use server";

import { createClient } from "@utils/supabase/server";
import { formatError } from "src/lib/utils";

export async function getPublicOrderDetails(orderId: string) {
  const supabase = await createClient();

  try {
    // 1. Fetch Order
    // Check if input is UUID using simple regex
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    
    let query = supabase
      .from("orders")
      .select("id, status, created_at, total_amount, delivery_fee, payment_status, reference");
      
    if (isUuid) {
      query = query.eq("id", orderId);
    } else {
      // Case-insensitive search for reference
      query = query.ilike("reference", orderId);
    }
    
    const { data: order, error } = await query.single();

    if (error || !order) {
       // Fallback: If failed as UUID, try reference (rare edge case where UUID-like string is ref)
       if (isUuid) {
           const { data: retryOrder, error: retryError } = await supabase
             .from("orders")
             .select("id, status, created_at, total_amount, delivery_fee, payment_status, reference")
             .ilike("reference", orderId)
             .single();
             
           if (retryError || !retryOrder) {
               console.error("Error fetching public order:", error);
               return { success: false, message: "Order not found" };
           }
           // Found via reference on retry
           // Assign retryOrder to order variable logic below requires 'const' restrictions, 
           // so better flow:
           return await fetchOrderAndItems(retryOrder.id, retryOrder, supabase);
       }
       
       console.error("Error fetching public order:", error);
       return { success: false, message: "Order not found" };
    }

    // Continue with items fetch using the found order.id
    return await fetchOrderAndItems(order.id, order, supabase);
  } catch (err) {
    return { success: false, message: formatError(err) };
  }
}


async function fetchOrderAndItems(orderId: string, order: any, supabase: any) {
    // 2. Fetch Order Items
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("id, quantity, price, product_id, bundle_id")
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("Error fetching items:", itemsError);
      return { success: true, order: { ...order, order_items: [] } };
    }

    // 3. Fetch Products and Bundles manually
    const productIds = items?.map((i: any) => i.product_id).filter(Boolean) || [];
    const bundleIds = items?.map((i: any) => i.bundle_id).filter(Boolean) || [];

    let products: any[] = [];
    let bundles: any[] = [];

    if (productIds.length > 0) {
      const { data } = await supabase
        .from("products")
        .select("id, name, images")
        .in("id", productIds);
      products = data || [];
    }

    if (bundleIds.length > 0) {
      const { data } = await supabase
        .from("bundles")
        .select("id, name, thumbnail_url")
        .in("id", bundleIds);
      bundles = data || [];
    }

    // 4. Attach details to items
    const enrichedItems = items?.map((item: any) => ({
      ...item,
      products: products.find((p) => p.id === item.product_id) || null,
      bundles: bundles.find((b) => b.id === item.bundle_id) || null,
    }));

    return { 
      success: true, 
      order: { 
        ...order, 
        order_items: enrichedItems 
      } 
    };
}
