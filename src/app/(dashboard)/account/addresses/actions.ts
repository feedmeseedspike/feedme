"use server";
import { createClient } from "@utils/supabase/server";
import { getUser } from "src/lib/actions/auth.actions";
import { Tables } from "src/utils/database.types";

// Add Address
export async function addAddressAction(
  addressData: Omit<
    Tables<"addresses">,
    "id" | "user_id" | "created_at" | "updated_at"
  >
) {
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
export async function updateAddressAction(
  id: string,
  updates: Partial<Tables<"addresses">>
) {
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

export async function getDeliveryLocations() {
  // Fetch delivery locations server-side
  const supabase = await createClient();
  const { data: locations, error: locationsError } = await supabase
    .from("delivery_locations")
    .select("*");
  if (locationsError) throw locationsError;
  return locations;
}

// Fetch all addresses for the current user (server-side)
export async function getAddressesForCurrentUser() {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.user_id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  // Map nulls to empty strings to match AddressWithId type
  return (data || []).map((addr: any) => ({
    id: addr.id,
    label: addr.label ?? "",
    street: addr.street ?? "",
    city: addr.city ?? "",
    state: addr.state ?? "",
    zip: addr.zip ?? "",
    country: addr.country ?? "",
    phone: addr.phone ?? "",
  }));
}
