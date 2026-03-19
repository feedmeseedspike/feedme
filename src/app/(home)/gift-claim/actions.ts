"use server";

import { createClient } from "@utils/supabase/server";
import { revalidatePath } from "next/cache";
import { sendOrderConfirmationEmails } from "@/utils/email/sendOrderEmail";

export async function getClaimLocations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivery_locations")
    .select("*")
    .order("name", { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function claimGiftAction(orderId: string, claimData: {
  fullName: string;
  phone: string;
  email?: string;
  street: string;
  location: string;
  saveAsBeneficiary?: boolean;
}) {
  const supabase = await createClient();
  
  // 1. Fetch the order to verify it's a gift and not yet claimed
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("*, profiles(*)")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) throw new Error("Order not found");
  
  const shippingAddress = order.shipping_address as any;
  if (!shippingAddress?.isGiftLink) {
    throw new Error("This gift has already been claimed or is not a gift link.");
  }

  if (order.payment_status !== "Paid") {
    throw new Error("This gift order has not been paid for yet.");
  }

  // 2. Update the order with recipient details
  const updatedAddress = {
    ...shippingAddress,
    fullName: claimData.fullName,
    phone: claimData.phone,
    email: claimData.email || shippingAddress.email,
    street: claimData.street,
    location: claimData.location,
    isGiftLink: false, // Mark as claimed
    claimedAt: new Date().toISOString()
  };

  const { data: updatedData, error: updateError } = await supabase
    .from("orders")
    .update({
      shipping_address: updatedAddress,
      local_government: claimData.location,
      status: "order confirmed" // Kick off the processing
    })
    .eq("id", orderId)
    .filter("shipping_address->isGiftLink", "eq", true)
    .select();

  if (updateError || !updatedData || updatedData.length === 0) {
    throw new Error("Gift could not be claimed. It may have already been claimed by someone else.");
  }

  // 3. Optional: Save as beneficiary for the SENDER
  if (claimData.saveAsBeneficiary && order.user_id) {
    try {
      await supabase.from("addresses").insert([{
        user_id: order.user_id,
        label: `Gift: ${claimData.fullName}`,
        street: claimData.street,
        city: claimData.location,
        state: "Lagos",
        phone: claimData.phone,
        country: "Nigeria"
      }]);
    } catch (err) {
      console.error("Failed to save beneficiary address:", err);
    }
  }

  // 4. Send notifications
  try {
     // 4a. Notify Recipient (if email provided)
     if (claimData.email) {
        await sendOrderConfirmationEmails({
           adminEmail: "orders.feedmeafrica@gmail.com",
           userEmail: claimData.email,
           adminOrderProps: {
              orderNumber: order.reference || order.order_id || order.id,
              customerName: claimData.fullName,
              customerPhone: claimData.phone,
              deliveryAddress: `${claimData.street}, ${claimData.location}`,
              localGovernment: claimData.location,
              discount: 0,
              subtotal: order.total_amount || 0,
              totalAmount: order.total_amount_paid || 0,
              itemsOrdered: []
           }
        });
     }

     // 4b. Notify Sender
     const senderEmail = shippingAddress.email || order.profiles?.email;
     if (senderEmail) {
        await sendOrderConfirmationEmails({
           adminEmail: "orders.feedmeafrica@gmail.com",
           userEmail: senderEmail,
           isGiftClaimNotice: true,
           adminOrderProps: {
              orderNumber: order.reference || order.order_id || order.id,
              customerName: claimData.fullName,
              customerPhone: claimData.phone,
              deliveryAddress: `${claimData.street}, ${claimData.location}`,
              localGovernment: claimData.location,
              discount: 0,
              subtotal: order.total_amount || 0,
              totalAmount: order.total_amount_paid || 0,
              itemsOrdered: [] 
           }
        });
     }
  } catch (err) {
     console.error("Failed to send claim notification:", err);
  }

  revalidatePath("/(dashboard)/admin/orders", "page");
  return { success: true };
}
