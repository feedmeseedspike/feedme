"use server";
import { createClient } from "@utils/supabase/server";
import { Tables } from "src/utils/database.types";

// Add Delivery Location
export async function addDeliveryLocationAction(locationData: Omit<Tables<"delivery_locations">, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivery_locations")
    .insert([locationData])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Update Delivery Location
export async function updateDeliveryLocationAction(id: string, updates: Partial<Tables<"delivery_locations">>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivery_locations")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Bulk Update Delivery Price
export async function bulkUpdateDeliveryPriceAction(ids: string[], price: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivery_locations")
    .update({ price })
    .in("id", ids)
    .select();
  if (error) throw error;
  return data;
}

// Bulk Delete Delivery Locations
export async function bulkDeleteDeliveryLocationsAction(ids: string[]) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("delivery_locations")
    .delete()
    .in("id", ids);
  if (error) throw error;
  return { success: true };
}

// Delete Delivery Location
export async function deleteDeliveryLocationAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("delivery_locations")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return { success: true };
}