"use server";
import { createClient } from "@utils/supabase/server";
import { getUser } from "src/lib/actions/auth.actions";
import { Tables, TablesInsert } from "src/utils/database.types";

// Add Address
export async function addAddressAction(
  addressData: TablesInsert<"addresses">
) {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");
  
  try {
    const supabase = await createClient();
    
    // Explicitly pick only the fields that exist in the database table
    const cleanAddressData = {
      label: addressData.label,
      street: addressData.street,
      city: addressData.city,
      state: addressData.state || "Lagos",
      zip: addressData.zip || "",
      country: addressData.country || "Nigeria",
      phone: addressData.phone,
      user_id: user.user_id
    };

    const { data, error } = await supabase
      .from("addresses")
      .insert([cleanAddressData])
      .select()
      .single();
      
    if (error) {
      console.error("Supabase insert error:", error);
      throw new Error(error.message);
    }
    return data;
  } catch (err: any) {
    console.error("addAddressAction crash:", err);
    throw err;
  }
}

// Update Address
export async function updateAddressAction(
  id: string,
  updates: Partial<Tables<"addresses">>
) {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");
  
  try {
    const supabase = await createClient();
    
    // Explicitly pick only the fields that exist in the database table
    const cleanUpdates: any = {};
    if (updates.label !== undefined) cleanUpdates.label = updates.label;
    if (updates.street !== undefined) cleanUpdates.street = updates.street;
    if (updates.city !== undefined) cleanUpdates.city = updates.city;
    if (updates.state !== undefined) cleanUpdates.state = updates.state;
    if (updates.zip !== undefined) cleanUpdates.zip = updates.zip;
    if (updates.country !== undefined) cleanUpdates.country = updates.country;
    if (updates.phone !== undefined) cleanUpdates.phone = updates.phone;

    const { data, error } = await supabase
      .from("addresses")
      .update(cleanUpdates)
      .eq("id", id)
      .eq("user_id", user.user_id)
      .select()
      .single();
      
    if (error) {
      console.error("Supabase update error:", error);
      throw new Error(error.message);
    }
    return data;
  } catch (err: any) {
    console.error("updateAddressAction crash:", err);
    throw err;
  }
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
