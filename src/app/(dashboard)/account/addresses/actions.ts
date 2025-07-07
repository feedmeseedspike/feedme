"use server";
import { createClient } from "@utils/supabase/server";
import { getUser } from "src/lib/actions/auth.actions";
import { Tables } from "src/utils/database.types";

// Add Address
export async function addAddressAction(addressData: Omit<Tables<"addresses">, "id" | "user_id" | "created_at" | "updated_at">) {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("addresses")
    .insert([{ ...addressData, user_id: user.user_id }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Update Address
export async function updateAddressAction(id: string, updates: Partial<Tables<"addresses">>) {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("addresses")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.user_id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Delete Address
export async function deleteAddressAction(id: string) {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");
  const supabase = await createClient();
  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.user_id);
  if (error) throw error;
  return { success: true };
} 
 
 
 
 