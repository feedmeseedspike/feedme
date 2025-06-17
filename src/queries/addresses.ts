import { createClient } from "../utils/supabase/client";
import { Tables } from "../utils/database.types";
import { AddressWithId, UserAddress } from "../lib/validator";

// Function to fetch all addresses for the current user
export async function getUserAddresses(): Promise<AddressWithId[] | null> {
  console.log("getUserAddresses: Function started.");
  let supabase;
  let user;
  let authError;

  try {
    supabase = await createClient();
    console.log("getUserAddresses: Supabase client created.");

    const { data: { user: fetchedUser }, error: fetchedAuthError } = await supabase.auth.getUser();
    user = fetchedUser;
    authError = fetchedAuthError;

    console.log("getUserAddresses: Supabase auth.getUser() result - user:", user, "authError:", authError);
  } catch (err: any) {
    console.error("getUserAddresses: Error during Supabase client creation or initial auth.getUser():", err);
    return null; // Return null if client creation or initial auth fails
  }

  if (authError || !user) {
    console.error("getUserAddresses: Authentication failed or no user found:", authError);
    // It's crucial to return null or an empty array here if no user is found
    // instead of throwing, if the hook is expected to handle unauthenticated state.
    return null; // Or []; depending on expected UX for unauthenticated users
  }

  console.log("getUserAddresses: User authenticated, attempting to fetch addresses for user ID:", user.id);
  try {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    console.log("getUserAddresses: Supabase query result - data:", data, "error:", error);

    if (error) {
      console.error("getUserAddresses: Supabase query error:", error);
      throw new Error(error.message || "Failed to fetch addresses from database.");
    }

    console.log("getUserAddresses: Successfully fetched data:", data);
    return data as AddressWithId[] | null;
  } catch (error: any) {
    console.error("getUserAddresses: An unexpected error occurred during fetch:", error);
    throw error; // Re-throw the error so react-query can catch it
  }
}

// Function to add a new address for the current user
export async function addAddress(address: Omit<Tables<"addresses">, "id" | "user_id" | "created_at" | "updated_at">): Promise<AddressWithId | null> {
   const supabase = await createClient();
   const { data: { user }, error: authError } = await supabase.auth.getUser();

   if (authError || !user) {
     throw new Error("User not authenticated.");
   }

   // Ensure user_id is set correctly from the authenticated user
   // We only need the properties defined in UserAddress for insertion
   const addressToInsert: Omit<Tables<"addresses">, "id" | "created_at" | "updated_at"> = { ...address, user_id: user.id };

   const { data, error } = await supabase
     .from("addresses")
     .insert(addressToInsert)
     .select(); // select the newly inserted row to get the generated id

   if (error) {
     console.error("Error adding address:", error);
     throw new Error(error.message || "Failed to add address.");
   }

   // Cast the returned data to AddressWithId
   return data && data.length > 0 ? data[0] as AddressWithId : null;
}

// Function to update an existing address
export async function updateAddress(id: string, updates: Partial<UserAddress>): Promise<AddressWithId | null> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User not authenticated.");
  }

  // Ensure the user can only update their own addresses
  const { data, error } = await supabase
    .from("addresses")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id) // Important: restrict update to the user's own addresses
    .select(); // select the updated row

  if (error) {
    console.error("Error updating address:", error);
    throw new Error(error.message || "Failed to update address.");
  }

   // Cast the returned data to AddressWithId
   return data && data.length > 0 ? data[0] as AddressWithId : null;
}

// Function to delete an address
export async function deleteAddress(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User not authenticated.");
  }

  // Ensure the user can only delete their own addresses
  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // Important: restrict deletion to the user's own addresses

  if (error) {
    console.error("Error deleting address:", error);
    throw new Error(error.message || "Failed to delete address.");
  }

  return true; // Indicate success
} 