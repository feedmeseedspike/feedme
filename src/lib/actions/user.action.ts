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

    // Fetch existing profile to check for birthday
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("birthday")
      .eq("user_id", user.id)
      .single();

    // Prevent birthday change if already set
    if (existingProfile?.birthday && validatedFields.data.birthday) {
        const newDate = new Date(validatedFields.data.birthday).toISOString().split('T')[0];
        const oldDate = new Date(existingProfile.birthday).toISOString().split('T')[0];
        
        if (newDate !== oldDate) {
             return {
                success: false,
                message: "Birthday cannot be changed once set. Please contact support.",
                errors: { birthday: ["Birthday cannot be changed once set."] }
             };
        }
    }

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


import supabaseAdmin from "../../utils/supabase/admin";

export async function getCustomerByIdAction(customerId: string) {
  // Use supabaseAdmin (Service Role) to bypass RLS policies
  const supabase = supabaseAdmin;

  try {
    let profileData: any = {};
    
    // 1. Fetch Profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', customerId)
      .single();

    if (error) {
      // If profile missing (PGRST116), just continue with empty profile data
      if (error.code !== 'PGRST116') {
        console.warn("Error fetching profile:", error.message);
      }
    } else {
        profileData = data;
    }
    
    // 2. Fetch addresses for this user (bypass RLS)
    const { data: addresses, error: addrError } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', customerId);

    if (addrError) {
      console.error("Error fetching addresses:", addrError);
    }

    // 3. Fetch Auth User Data (Fallback)
    let authUser = null;
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(customerId);
      if (!authError && authData) {
        authUser = authData.user;
      }
    } catch (e) {
      console.error("Error fetching auth user:", e);
    }

    const email = profileData?.email || authUser?.email || null;
    const displayName = profileData?.display_name || authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || authUser?.user_metadata?.display_name || null;
    
    // Return merged data
    return {
      ...profileData,
      id: profileData?.id || customerId, // Ensure ID is present
      user_id: customerId,
      email: email,
      display_name: displayName,
      addresses: addresses || []
    };
    
  } catch (error: any) {
    console.error("getCustomerByIdAction failed:", error);
    // Return a minimal usable object rather than crashing the UI
    return {
        id: customerId,
        user_id: customerId,
        display_name: 'Unknown User',
        email: null,
        addresses: [],
        error: error.message
    }
  }
}

// Action to fetch orders for a given customer ID
export async function getCustomerOrdersAction(customerId: string) {
  // Use supabaseAdmin to ensure admins can see orders
  const supabase = supabaseAdmin;

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching customer orders:", error);
      return []; // Return empty array on error
    }
    
    return data; 
    
  } catch (error: any) {
     console.error("getCustomerOrdersAction exception:", error);
     return [];
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

export async function getTodaysBirthdaysAction() {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name, email, birthday, avatar_url, favorite_fruit")
      .not('birthday', 'is', null);

    if (error) throw error;

    const today = new Date();
    const currentMonth = today.getMonth(); // 0-11
    const currentDay = today.getDate();

    const birthdays = (profiles || []).filter((profile) => {
      if (!profile.birthday) return false;
      const birthDate = new Date(profile.birthday);
      // Check if month and day match
      return birthDate.getMonth() === currentMonth && birthDate.getDate() === currentDay;
    });

    return { success: true, data: birthdays };
  } catch (error: any) {
    console.error("Error fetching birthdays:", error);
    return { success: false, error: error.message, data: [] };
  }
}
