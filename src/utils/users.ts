import { createClient } from './supabase/client';
import type { User } from '@supabase/supabase-js';
import { Database, Tables, TablesInsert, TablesUpdate } from './database.types';

const supabase = createClient();

export interface IUserLink {
  id: string;
  label: string;
  url: string;
}

export interface IUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  created_at: Date;
  updated_at?: Date;
  provider: 'google' | 'email';
}

export const users = {
  async getUser(user_id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();
    if (error) throw error;
    return data as Tables<'profiles'> | null;
  },

  async createUser(user: TablesInsert<'profiles'>) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([user])
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as Tables<'profiles'>;
  },

  async captureUserDetails(authUser: User) {
    // Check if user already exists
    const existingUser = await this.getUser(authUser.id).catch(() => null);
    if (existingUser) return existingUser;

    // Create new profile
    const newUser: TablesInsert<'profiles'> = {
      user_id: authUser.id,
      display_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '',
      avatar_url: authUser.user_metadata?.avatar_url || '',
    };
    return await this.createUser(newUser);
  },

  async updateUser(user_id: string, updates: TablesUpdate<'profiles'>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user_id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as Tables<'profiles'>;
  },

  async updateProfile(
    userId: string,
    updates: TablesUpdate<'profiles'>
  ) {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId);
    if (error) throw error;
    // Optionally update auth user metadata if avatar_url or display_name changed
  },
};

export async function linkAuthUserToProfile(authUserId: string, _email: string) {
  // 1. Find user profile by user_id
  const { data: user, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', authUserId)
    .maybeSingle();

  if (user) {
    // Profile already exists for this user_id
    return { returningUser: true };
  } else {
    // Create a new profile if not found
    const insert: TablesInsert<'profiles'> = { user_id: authUserId };
    await supabase.from('profiles').insert([insert]);
    return { returningUser: false };
  }
}
