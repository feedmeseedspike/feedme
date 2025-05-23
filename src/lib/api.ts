import { supabase } from './supabaseClient';

export async function getVendors() {
  const { data, error } = await supabase.from('vendors').select('*');
  if (error) throw error;
  return data;
}

export async function getCategories() {
  const { data, error } = await supabase.from('categories').select('*');
  if (error) throw error;
  return data;
}

export async function getProducts() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) throw error;
  return data;
}

export async function getAgents() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'agent');
  if (error) throw error;
  return data;
}

export async function getCustomers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'buyer');
  if (error) throw error;
  return data;
}

export async function getCategoriesByIds(ids: string[]) {
  if (!ids || ids.length === 0) return [];
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .in('id', ids);
  if (error) throw error;
  return data;
}

export async function addProduct(product: any) {
  const { data, error } = await supabase.from('products').insert([product]).select();
  if (error) throw error;
  return data?.[0];
}

export async function updateProduct(id: string, product: any) {
  const { data, error } = await supabase.from('products').update(product).eq('id', id).select();
  if (error) throw error;
  return data?.[0];
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
  return true;
} 