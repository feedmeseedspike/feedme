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
