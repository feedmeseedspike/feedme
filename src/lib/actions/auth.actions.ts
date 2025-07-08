"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { formatError } from "src/lib/utils";
import { createClient } from "src/utils/supabase/server";
import { Tables } from "src/utils/database.types";
import supabaseAdmin from '@/utils/supabase/admin';

export interface AuthSuccess<T> { success: true; data: T; }
interface AuthFailure { success: false; error: { message: string } | string; }

export type RegisterUserReturn = AuthSuccess<any> | AuthFailure;
export type SignInUserReturn = AuthSuccess<any> | AuthFailure;
export type SignOutUserReturn = { success: true };
export type GetUserReturn = (Tables<'profiles'> & { email: string | null }) | null;
export type UpdatePasswordReturn = AuthSuccess<any> | AuthFailure;

// Example usage of sendEmail for password reset:
// import { sendEmail } from '@/utils/email';
// await sendEmail({
//   to: user.email,
//   subject: 'Reset your password',
//   html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
// });

// Sign Up
export async function registerUser(userData: { name: string; email: string; password: string; avatar_url?: string }): Promise<RegisterUserReturn> {
  const supabase = await createClient();

  try {
    // Try to sign up the user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: { display_name: userData.name, name: userData.name, avatar_url: userData.avatar_url },
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

    // Create wallet for the new user
    await supabase
      .from('wallets')
      .insert({ user_id: data.user.id, balance: 0, currency: 'NGN' });

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: { message: error?.message || 'Something went wrong' } };
  }
}

// Sign In
export async function signInUser(credentials: { email: string; password: string }): Promise<SignInUserReturn> {
  // Enforce single sign-in method: block email/password login for Google users
  try {
    // Fetch the first page of users (up to 1000, adjust if needed)
    const { data, error: userQueryError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (userQueryError) {
      return { success: false, error: { message: 'Error checking user provider.' } };
    }
    if (data && data.users && data.users.length > 0) {
      const user = data.users.find((u: any) => u.email === credentials.email);
      if (user) {
        const providers = user.app_metadata?.providers;
        if (providers && Array.isArray(providers) && providers.includes('google')) {
          return { success: false, error: { message: 'Incorrect email or password.' } };
        }
      }
    }
  } catch (err) {
    // Fallback: allow login if provider check fails
  }

  const supabase = await createClient();
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    
    if (error) throw error;


    return { success: true, data };
  } catch (error: any) {
    if (
      error.message &&
      error.message.toLowerCase().includes('invalid login credentials')
    ) {
      return { success: false, error: { message: 'Incorrect email or password.' } };
    }
    return { success: false, error: formatError(error.message) };
  }
}


// Sign Out
export async function signOutUser(): Promise<SignOutUserReturn> {
  const supabase = await createClient();
  try {
    await supabase.auth.signOut();
  } catch {}
  cookies().delete("accessToken");
  revalidatePath("/"); // Refresh session-based UI
  return { success: true };
}

// Get User Data (Persist Login)
export async function getUser(): Promise<GetUserReturn> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profile) {
    return { ...profile, email: user.email ?? null };
    }

    // Fallback: use the auth user if no profile row
    return {
      user_id: user.id,
      display_name: typeof user.user_metadata?.display_name === 'string'
        ? user.user_metadata.display_name
        : (typeof user.email === 'string' ? user.email : null),
      avatar_url: typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null,
      birthday: null,
      created_at: typeof user.created_at === 'string' ? user.created_at : null,
      favorite_fruit: null,
      role: null,
      status: null,
      email: user.email ?? null,
    };
  } catch (error) {
    return null;
  }
}

// Request Password Reset
// Direct Password Reset (without token)
export async function updatePassword(currentPassword: string, newPassword: string): Promise<UpdatePasswordReturn> {
  const supabase = await createClient();
  try {
    // Get the current user's email to verify the current password
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      throw new Error(userError?.message || "User not authenticated or email not found.");
    }

    // Verify current password by attempting to sign in with email and current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        return { success: false, error: { message: 'Incorrect current password' } };
      }
      throw signInError;
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: formatError(error.message) };
  }
}

// Request Password Reset
export async function requestPasswordReset(email: string) {
  const supabase = await createClient();
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Something went wrong.' };
  }
}

// oyedelejeremiah.ng@gmail.com