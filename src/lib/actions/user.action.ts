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
      role: formData.get("role"),
      avatar: formData.get("avatar"),
      birthday: formData.get("birthday"),
      favorite_fruit: formData.get("favorite_fruit"),
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

    // Handle avatar upload if it's a File
    const avatarFile = formData.get("avatar");
    if (avatarFile instanceof File && avatarFile.size > 0) {
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("user-avatars")
        .upload(filePath, avatarFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from("user-avatars")
        .getPublicUrl(filePath);

      avatarUrl = publicUrlData.publicUrl;
    } else if (typeof avatarFile === 'string' && avatarFile === '') {
      // If an empty string is explicitly sent, set avatarUrl to null to remove it
      avatarUrl = null;
    } else if (typeof avatarFile === 'string') {
      // If it's a non-empty string, assume it's an existing URL and keep it
      avatarUrl = avatarFile;
    }

    // Determine the birthday value to send to Supabase
    let birthdayForDb = validatedFields.data.birthday;
    if (birthdayForDb === "") {
        birthdayForDb = null;
    }


    // Update user data in the database
    const updateData = {
      display_name: validatedFields.data.display_name,
      role: validatedFields.data.role,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      birthday: birthdayForDb,
      favorite_fruit: validatedFields.data.favorite_fruit,
    };

    const updateResult = await supabase
      .from("profiles")
      .update(updateData)
      .eq("user_id", user.id);


    if (updateResult.error) {
      throw new Error(updateResult.error.message);
    }

    revalidatePath("/"); // Revalidate cache for the root path
    
    return {
      success: true,
      message: "Profile updated successfully",
      avatarUrl,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Something went wrong",
      errors: null,
    };
  }
}


export async function getCustomerByIdAction(customerId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*') // Select all fields, adjust if you need a specific subset
      // Query using the string ID directly
      .eq('user_id', customerId)
      .eq('role', 'buyer')
      .single(); // Expect a single result

    if (error) {
      throw new Error(error.message); // Throw an error if fetching fails
    }
    
    // The data structure from Supabase should ideally match your Customer interface.
    // If there are differences, you might need to transform the data here.
    
    // Return null if no customer is found with the given ID and role
    return data; // data will be null if .single() finds no match
    
  } catch (error: any) {
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
      throw new Error(error.message || "Failed to fetch customer orders");
    }
    
    // data will be an array of order objects (can be empty)
    return data; 
    
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch customer orders");
  }
}

export async function updateStaffStatus(userId: string, isStaff: boolean) {
  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ is_staff: isStaff })
      .eq("user_id", userId);
    if (error) {
      return { success: false, error: error.message };
    }
    revalidatePath("/admin/customers");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error" };
  }
}
