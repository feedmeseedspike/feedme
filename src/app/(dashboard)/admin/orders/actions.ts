"use server";
import { createClient } from "@utils/supabase/server";
import { getUser } from "src/lib/actions/auth.actions";
import { Database } from "@/utils/database.types";

// Update Order Status
export async function updateOrderStatusAction(orderId: string, newStatus: Database["public"]["Enums"]["order_status_enum"]) {
  const user = await getUser();
  if (!user || user.role !== "admin") throw new Error("Not authorized");
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);
  if (error) throw error;
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
 
 
 
 