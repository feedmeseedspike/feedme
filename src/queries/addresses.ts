import { createClient } from "../utils/supabase/client";
import { Tables } from "../utils/database.types";
import { AddressWithId, UserAddress } from "../lib/validator";
import type { SupabaseClient } from '@supabase/supabase-js';

export async function getUserAddresses(userId: string): Promise<AddressWithId[] | null> {
  const supabase = await createClient();
  if (!userId) return null;
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("getUserAddresses: Supabase query error:", error);
    return null;
  }
  return data as AddressWithId[] | null;
}

// Client-side: pass supabase client
export async function addAddress(address: Omit<Tables<"addresses">, "id" | "user_id" | "created_at" | "updated_at">, user_id: string, supabase: SupabaseClient): Promise<AddressWithId | null> {
  if (!user_id) {
    throw new Error("User not authenticated.");
  }
  const addressToInsert: Omit<Tables<"addresses">, "id" | "created_at" | "updated_at"> = { ...address, user_id };
  const { data, error } = await supabase
    .from("addresses")
    .insert(addressToInsert)
    .select();
  if (error) {
    console.error("Error adding address:", error);
    throw new Error(error.message || "Failed to add address.");
  }
  if (!data || data.length === 0) {
    throw new Error("Failed to add address. No data returned.");
  }
  return data[0] as AddressWithId;
}

export async function updateAddress(id: string, updates: Partial<UserAddress>, user_id: string, supabase: SupabaseClient): Promise<AddressWithId | null> {
  if (!user_id) {
    throw new Error("User not authenticated.");
  }
  const { data, error } = await supabase
    .from("addresses")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user_id)
    .select();
  if (error) {
    console.error("Error updating address:", error);
    throw new Error(error.message || "Failed to update address.");
  }
  return data && data.length > 0 ? data[0] as AddressWithId : null;
}

export async function deleteAddress(id: string, user_id: string, supabase: SupabaseClient): Promise<boolean> {
  if (!user_id) {
    throw new Error("User not authenticated.");
  }
  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user_id);
  if (error) {
    console.error("Error deleting address:", error);
    throw new Error(error.message || "Failed to delete address.");
  }
  return true;
} 