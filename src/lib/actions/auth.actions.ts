"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { formatError } from "src/lib/utils";
import { createClient } from "src/utils/supabase/server";

// Sign Up
export async function registerUser(userData: { name: string; email: string; password: string }) {
  const supabase = await createClient();

  try {
    // Check if email already exists in users table
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .single();

    if (existingUser) {
      return { success: false, error: { message: 'This email is already registered. Try signing in instead.' } };
    }

    if (checkError && checkError.code !== 'PGRST116') {
      return { success: false, error: { message: checkError.message } };
    }

    // Try to sign up the user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: { display_name: userData.name, name: userData.name },
        emailRedirectTo: process.env.NEXT_PUBLIC_SITE_URL + "/auth/callback",
      },
    });

    if (signUpError) {
      if (signUpError.message.includes('User already registered')) {
        return { success: false, error: { message: 'This email is already registered. Try signing in instead.' } };
      }
      return { success: false, error: { message: signUpError.message } };
    }

    if (!data.user) {
      return { success: false, error: { message: 'Failed to create user account' } };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: { message: error?.message || 'Something went wrong' } };
  }
}

// Sign In
export async function signInUser(credentials: { email: string; password: string }) {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    if (error) throw error;
    // Store the access token and refresh token in cookies (HTTP only for security)
    if (data.session?.access_token) {
      cookies().set("accessToken", data.session.access_token, { httpOnly: true });
    }
    if (data.session?.refresh_token) {
      cookies().set("refreshToken", data.session.refresh_token, { httpOnly: true });
    }
    console.log(data)
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: formatError(error.message) };
  }
}


// Sign Out
export async function signOutUser() {
  const supabase = await createClient();
  try {
    await supabase.auth.signOut();
  } catch {}
  cookies().delete("accessToken");
  revalidatePath("/"); // Refresh session-based UI
  return { success: true };
}

// Get User Data (Persist Login)
export async function getUser() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return profile;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

// Request Password Reset
// Direct Password Reset (without token)
export async function updatePassword(currentPassword: string, newPassword: string) {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error: any) {
    // Handle specific Supabase auth errors if needed
    if (error.message.includes('Invalid login credentials')) {
        return { success: false, error: { message: 'Incorrect current password' } };
    }
    return { success: false, error: formatError(error.message) };
  }
}

