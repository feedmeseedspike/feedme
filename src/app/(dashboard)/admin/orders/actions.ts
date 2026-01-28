"use server";
import { createClient } from "@utils/supabase/server";
import { getUser } from "src/lib/actions/auth.actions";
import { Database } from "@/utils/database.types";
import { sendUnifiedNotification } from "src/lib/actions/notifications.actions";

import { BONUS_CONFIG } from "src/lib/deals";

// Update Order Status
export async function updateOrderStatusAction(orderId: string, newStatus: Database["public"]["Enums"]["order_status_enum"]) {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Not authorized");
  const supabase = await createClient();
  
  // Fetch order details first for logic
  const { data: order } = await supabase.from("orders").select("user_id, total_amount, reference").eq("id", orderId).single();

  // Update order status
  const { error } = await supabase
    .from("orders")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) throw error;

  // --- RETRACTION LOGIC FOR REFUNDS ---
  if (newStatus === "Cancelled" && order?.user_id) {
     try {
        const amount = order.total_amount || 0;
        
        // 1. Retract Loyalty Points
        let pointsToRetract = 0;
        // Find highest applicable tier
        const tier = [...BONUS_CONFIG.LOYALTY_TIERS].reverse().find(t => amount >= t.threshold);
        if (tier) {
            pointsToRetract = tier.points;
        }

        if (pointsToRetract > 0) {
            const { data: profile } = await supabase.from('profiles').select('loyalty_points').eq('user_id', order.user_id).single();
            if (profile) {
                 const newPoints = Math.max(0, (profile.loyalty_points || 0) - pointsToRetract);
                 await supabase.from('profiles').update({ loyalty_points: newPoints }).eq('user_id', order.user_id);
                 // We could send a notification about retraction here too
            }
        }
     } catch (err) {
         console.error("Error retracting bonuses:", err);
     }
  }
  
  // Send in-app and push notification
  try {
     if (order?.user_id) {
       await sendUnifiedNotification({
         userId: order.user_id,
         type: "info",
         title: "Order Update",
         body: `Your order #${order.reference || orderId.substring(0, 8)} is now ${newStatus}.`,
         link: `/account/orders/${orderId}`
       });
     }
  } catch (notiError) {
     console.warn("Status change notification failed:", notiError);
  }

  // Send email notification for status updates (except "order confirmed" which is sent after payment)
  if (newStatus !== "order confirmed") {
    try {
      // Get order details for email
      // Note: This separate query for email might work if it uses a different query structure or if the relationship exists but is sensitive to how it's called. 
      // We will leave this as is since the user's error is in the fetchOrderDetailsAction.
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
        // Send email notification locally (no API call)
        const allowedStatuses = ["In transit", "order delivered", "order confirmed", "Cancelled"] as const;
        type EmailStatus = (typeof allowedStatuses)[number];

        if (allowedStatuses.includes(newStatus as any)) {
          const { sendStatusUpdateEmail } = await import("@/utils/email/sendStatusUpdateEmail");
          
          await sendStatusUpdateEmail({
              userEmail,
              orderNumber: order.reference || order.order_id || order.id,
              customerName: userName,
              newStatus: newStatus as EmailStatus,
              itemsOrdered,
              deliveryAddress: shipping?.street || "Address not available",
          });
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
  
  // Send notification for payment status update
  try {
    const { data: order } = await supabase.from("orders").select("user_id, reference").eq("id", orderId).single();
    if (order?.user_id) {
      await sendUnifiedNotification({
        userId: order.user_id,
        type: "info",
        title: "Payment Update",
        body: `Payment for order #${order.reference || orderId.substring(0, 8)} is now ${newStatus}.`,
        link: `/account/orders/${orderId}`
      });
    }
  } catch (notiError) {
    console.warn("Payment update notification failed:", notiError);
  }
  return { success: true };
}

// Revert to manual batch fetching to avoid PGRST200 foreign key errors
export async function fetchOrderDetailsAction(orderId: string) {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Not authorized");
  
  const supabase = await createClient();
  
  console.log("fetchOrderDetailsAction START", orderId);

  // 1. Fetch Order
  // Removed 'phone' from profiles selection as it doesn't exist
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

  // Parse shipping_address if it is a string
  const parsedShippingAddress = typeof order.shipping_address === "string"
    ? (() => { try { return JSON.parse(order.shipping_address); } catch { return null; } })()
    : order.shipping_address;
  
  // Assign parsed address back
  const orderWithParsedAddress = { ...order, shipping_address: parsedShippingAddress };

  // 2. Fetch Items (Manual Batching)
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (itemsError) {
    console.error("fetchOrderDetailsAction Error fetching items:", itemsError);
    return { ...orderWithParsedAddress, order_items: [] };
  }

  if (!items || items.length === 0) {
     console.log("fetchOrderDetailsAction No items found in order_items table");
     return { ...orderWithParsedAddress, order_items: [] };
  }

  // 3. Batch Fetch Related Data
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
    bundles: item.bundle_id ? bundles.find(b => b.id === item.bundle_id) : 
              (item.bundle_id ? { id: item.bundle_id, name: 'Unknown Bundle' } : null), // Fallback
    offers: item.offer_id ? offers.find(o => o.id === item.offer_id) : null,
  }));
  
  // Normalize fields for UI (UI expects 'image' for bundles, 'images' for products)
  const finalItems = enrichedItems.map((item: any) => ({
      ...item,
      bundles: item.bundles ? { ...item.bundles, image: item.bundles.thumbnail_url } : null
  }));


  // 5. Fetch Voucher
  let voucherData = null;
  if (order.voucher_id) {
    const { data: v } = await supabase.from("vouchers").select("*").eq("id", order.voucher_id).single();
    voucherData = v;
  }
  
  console.log("fetchOrderDetailsAction END success, items:", finalItems.length);
  return { ...orderWithParsedAddress, order_items: finalItems, vouchers: voucherData };
}