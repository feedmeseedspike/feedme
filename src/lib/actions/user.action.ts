"use server";

import { createClient } from "src/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { UserProfileSchema } from "../../lib/validator";

export async function updateUserInfo(currentState: any, formData: FormData) {
  const supabase = await createClient();

  try {
    // Validate form data
    const validatedFields = UserProfileSchema.safeParse({
      display_name: formData.get("display_name"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      role: formData.get("role"),
      avatar: formData.get("avatar"),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Validation failed",
      };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    let avatarUrl = null;

    if (
      validatedFields.data.avatar &&
      validatedFields.data.avatar instanceof File &&
      validatedFields.data.avatar.size > 0
    ) {
      const fileExt = validatedFields.data.avatar.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("user-avatars")
        .upload(filePath, validatedFields.data.avatar, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("user-avatars")
        .getPublicUrl(filePath);

      avatarUrl = publicUrl;
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({
        display_name: validatedFields.data.display_name,
        phone: validatedFields.data.phone || null,
        address: validatedFields.data.address || null,
        role: validatedFields.data.role,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      })
      .eq("id", user.id);

    if (updateError) throw updateError;

    revalidatePath("/account");

    return { success: true, avatarUrl, errors: null };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Something went wrong",
      errors: null,
    };
  }
}

// Action to fetch a single customer (user with role 'buyer') by ID
// Accept customerId as string, assuming it's a UUID
export async function getCustomerByIdAction(customerId: string) {
  console.warn(`Fetching customer (user with role 'buyer') with ID: ${customerId}`);
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*') // Select all fields, adjust if you need a specific subset
      // Query using the string ID directly
      .eq('id', customerId)
      .eq('role', 'buyer')
      .single(); // Expect a single result

    if (error) {
      console.error("Error fetching customer by ID:", error);
      // Depending on how you want to handle not found vs other errors,
      // you might want to check error.code, e.g., 'PGRST116' for not found
      throw new Error(error.message); // Throw an error if fetching fails
    }
    
    // The data structure from Supabase should ideally match your Customer interface.
    // If there are differences, you might need to transform the data here.
    
    // Return null if no customer is found with the given ID and role
    return data; // data will be null if .single() finds no match
    
  } catch (error: any) {
    console.error("Exception in getCustomerByIdAction:", error);
    throw new Error(error.message || "Failed to fetch customer");
  }
}

// Action to fetch orders for a given customer ID
// Accept customerId as string, assuming it's a UUID
export async function getCustomerOrdersAction(customerId: string) {
  const supabase = await createClient();

  try {
    // Assuming an 'orders' table with a 'user_id' foreign key (corrected)
    const { data, error } = await supabase
      .from('orders')
      .select('*') // Select all order fields, adjust if needed
      // Use the correct column name 'user_id'
      .eq('user_id', customerId) // Corrected column name
      .order('created_at', { ascending: false }); // Order by creation date, newest first

    if (error) {
      console.error("Error fetching customer orders:", error);
      throw new Error(error.message || "Failed to fetch customer orders");
    }
    
    // data will be an array of order objects (can be empty)
    return data; 
    
  } catch (error: any) {
    console.error("Exception in getCustomerOrdersAction:", error);
    throw new Error(error.message || "Failed to fetch customer orders");
  }
}
