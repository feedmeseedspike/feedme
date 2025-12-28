"use server";
import { createClient } from "@utils/supabase/server";
import { getUser } from "src/lib/actions/auth.actions";
import { Database } from "@/utils/database.types";

// Update Order Status
export async function updateOrderStatusAction(orderId: string, newStatus: Database["public"]["Enums"]["order_status_enum"]) {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Not authorized");
  const supabase = await createClient();
  
  // Update order status
  const { error } = await supabase
    .from("orders")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) throw error;

  // Send email notification for status updates (except "order confirmed" which is sent after payment)
  if (newStatus !== "order confirmed") {
    try {
      // Get order details for email
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(`
          *,
          profiles!orders_user_id_fkey (full_name, display_name)
        `)
        .eq("id", orderId)
        .single();

      if (orderError || !order) {
        console.error("Failed to fetch order for email:", orderError);
        return { success: true, message: "Status updated but email notification failed" };
      }

      // Get order items
      const { data: orderItems } = await supabase
        .from("order_items")
        .select(`*, products (name), bundles (name), offers (title)`)
        .eq("order_id", orderId);

      // Format items for email
      const itemsOrdered = orderItems?.map(item => ({
        title: item.products?.name || item.bundles?.name || item.offers?.title || "Product",
        price: item.price || 0,
        quantity: item.quantity || 1,
        optionName: item.option?.name || undefined,
        customizations: item.option?.customizations || undefined,
      })) || [];

      // Parse shipping address
      const shipping = typeof order.shipping_address === "string" 
        ? JSON.parse(order.shipping_address) 
        : order.shipping_address;

      const userEmail = shipping?.email;
      const userName = order.profiles?.display_name || order.profiles?.full_name || shipping?.fullName || "Customer";

      if (userEmail) {
        // Send email notification
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email/send-order-status-update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail,
            orderNumber: order.order_id || order.id,
            customerName: userName,
            newStatus,
            itemsOrdered,
            deliveryAddress: shipping?.street || "Address not available",
          }),
        });

        const emailResult = await response.json();
        if (!emailResult.success) {
          console.error("Email notification failed:", emailResult.error);
        }
      }
    } catch (emailError) {
      console.error("Failed to send status update email:", emailError);
    }
  }

  return { success: true };
}

// Update Payment Status
export async function updatePaymentStatusAction(orderId: string, newStatus: Database["public"]["Enums"]["payment_status_enum"]) {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Not authorized");
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ payment_status: newStatus })
    .eq("id", orderId);
  if (error) throw error;
  return { success: true };
}

export async function fetchOrderDetailsAction(orderId: string) {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Not authorized");
  const supabase = await createClient();
  
  console.log("fetchOrderDetailsAction START", orderId);

  // 1. Fetch Order
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      profiles:user_id(display_name)
    `)
    .eq('id', orderId)
    .single()
  
  if (error) {
    console.error("fetchOrderDetailsAction Error fetching order:", error);
    throw new Error(`Failed to fetch order details: ${error.message}`)
  }

  // 2. Fetch Items
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (itemsError) {
    console.error("fetchOrderDetailsAction Error fetching items:", itemsError);
    return { ...order, order_items: [] };
  }

  if (!items || items.length === 0) {
     console.log("fetchOrderDetailsAction No items found");
     return { ...order, order_items: [] };
  }

  // 3. Batch Fetch Details
  const productIds = [...new Set(items.map((i: any) => i.product_id).filter(Boolean))];
  const bundleIds = [...new Set(items.map((i: any) => i.bundle_id).filter(Boolean))];
  const offerIds = [...new Set(items.map((i: any) => i.offer_id).filter(Boolean))];

  let products: any[] = [];
  let bundles: any[] = [];
  let offers: any[] = [];

  if (productIds.length > 0) {
    const { data } = await supabase.from("products").select("id, name, images").in("id", productIds);
    products = data || [];
  }
  
  if (bundleIds.length > 0) {
    const { data } = await supabase.from("bundles").select("id, name, thumbnail_url").in("id", bundleIds);
    bundles = data || [];
  }

  if (offerIds.length > 0) {
    const { data } = await supabase.from("offers").select("id, title").in("id", offerIds);
    offers = data || [];
  }

  // 4. Map details back
  const enrichedItems = items.map((item: any) => ({
    ...item,
    products: item.product_id ? products.find(p => p.id === item.product_id) : null,
    bundles: item.bundle_id ? bundles.find(b => b.id === item.bundle_id) : null,
    offers: item.offer_id ? offers.find(o => o.id === item.offer_id) : null,
  }));

  // 5. Fetch Voucher
  let voucherData = null;
  if (order.voucher_id) {
    const { data: v } = await supabase.from("vouchers").select("*").eq("id", order.voucher_id).single();
    voucherData = v;
  }
  
  console.log("fetchOrderDetailsAction END success, items:", enrichedItems.length);
  return { ...order, order_items: enrichedItems, vouchers: voucherData };
}