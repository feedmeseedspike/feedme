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
          profiles!orders_user_id_fkey (email, full_name, display_name)
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
        .select(`*, products (name), bundles (name)`)
        .eq("order_id", orderId);

      // Format items for email
      const itemsOrdered = orderItems?.map(item => ({
        title: item.products?.name || item.bundles?.name || "Product",
        price: item.price || 0,
        quantity: item.quantity || 1,
        optionName: item.option?.name || undefined,
        customizations: item.option?.customizations || undefined,
      })) || [];

      // Parse shipping address
      const shipping = typeof order.shipping_address === "string" 
        ? JSON.parse(order.shipping_address) 
        : order.shipping_address;

      const userEmail = order.profiles?.email;
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
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      profiles:user_id(display_name),
      order_items(*,
        products(name, images),
        bundles(name, thumbnail_url)
      )
    `)
    .eq('id', orderId)
    .single()
  
  if (error) {
    throw new Error(`Failed to fetch order details: ${error.message}`)
  }
  
  return data
}