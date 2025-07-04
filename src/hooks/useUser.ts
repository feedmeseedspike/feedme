"use client"


import { useSupabaseUser, useSupabaseSession } from "@components/supabase-auth-provider";

interface SupabaseAuthUser {
  id: string;
  display_name?: string;
  email?: string;
  avatar_url?: string;
}

export type UserWithEmail = {
  avatar_url: string | null;
  birthday: string | null;
  created_at: string | null;
  display_name: string | null;
  favorite_fruit: string | null;
  role: string | null;
  status: string | null;
  user_id: string;
  email: string | null;
  [key: string]: any;
};

export function useUser() {
  const user = useSupabaseUser();
  const session = useSupabaseSession();
  return { user, isLoading: false, session };
}