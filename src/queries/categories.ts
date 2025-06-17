import { TypedSupabaseClient } from '../utils/types';
import { createClient } from "@utils/supabase/client";

export function getAllCategoriesQuery(client: TypedSupabaseClient) {
  return client
    .from('categories')
    .select('id, title, thumbnail');
}

export async function getCategoryById(client: TypedSupabaseClient, id: string) {
  const { data, error } = await client.from('categories').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
} 