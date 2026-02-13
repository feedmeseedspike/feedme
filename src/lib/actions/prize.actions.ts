"use server";

import supabaseAdmin from "src/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export type SpinPrizeRow = {
  id: string;
  slug?: string;
  label: string;
  sub_label?: string;
  type: 'item' | 'wallet_cash' | 'voucher_percent' | 'none';
  value: number;
  probability: number;
  color_bg: string;
  color_text: string;
  image_url?: string;
  code?: string;
  product_id?: string;
  is_active: boolean;
  for_new_users_only?: boolean;
  sort_order?: number;
  product_option?: any;
  min_orders_required?: number;
  product?: {
      id: string;
      name: string;
      price: number;
      images: string[];
      options?: any[];
  };
};

function normalizeProduct(prod: any) {
    if (!prod) return undefined;
    return {
          id: prod.id,
          name: prod.name || prod.title,
          price: prod.price ?? prod.list_price ?? prod.new_price ?? 0,
          images: Array.isArray(prod.images) ? prod.images : (prod.image_url ? [prod.image_url] : []),
          options: prod.options
    };
}

function cleanPayload(payload: Partial<SpinPrizeRow>) {
    const { product, ...rest } = payload;
    
    // Auto-generate slug if missing to prevent 23502 error (Not Null Constraint)
    if (!rest.slug || rest.slug.trim() === '') {
        const base = (rest.label || 'prize').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        // Add random suffix to guarantee uniqueness
        rest.slug = `${base}-${Math.floor(Math.random() * 100000)}`;
    }

    // Ensure colors are present (defaults)
    if (!rest.color_bg) rest.color_bg = '#FFFFFF';
    if (!rest.color_text) rest.color_text = '#000000';

    return rest;
}

export async function getDebugInfo() {
  const supabase = supabaseAdmin; 
  const { count, error } = await supabase.from('spin_prizes').select('*', { count: 'exact', head: true });
  
  if (error) {
      return { status: 'error', message: error.message, code: error.code };
  }
  return { status: 'ok', count };
}

export async function getSpinPrizes() {
  const supabase = supabaseAdmin; 
  
  const { data: prizes, error: currentError } = await supabase
    .from('spin_prizes')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (currentError) {
      console.error("Spin Prizes Fetch Error:", currentError);
      return [];
  }

  if (!prizes || prizes.length === 0) return [];

  const productIds = prizes
    .map((p) => p.product_id)
    .filter((id) => id !== null && id !== undefined);

  let productsMap = new Map();

  if (productIds.length > 0) {
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('*') 
        .in('id', productIds);
      
      if (prodError) {
          console.error("Spin Prizes Product Fetch Error:", prodError);
      } else if (products) {
          products.forEach(p => productsMap.set(p.id, p));
      }
  }

  const merged = prizes.map((p) => {
      const rawProd = p.product_id ? productsMap.get(p.product_id) : undefined;
      return {
          ...p,
          product: normalizeProduct(rawProd)
      };
  });

  return merged as SpinPrizeRow[];
}

export async function getProductsList() {
    const supabase = supabaseAdmin; 
    const { data } = await supabase
        .from('products')
        .select('*') 
        .limit(300);
    
    return (data || []).map(p => normalizeProduct(p)).filter(p => p !== undefined).sort((a,b) => a!.name.localeCompare(b!.name));
}

export async function createSpinPrize(payload: Partial<SpinPrizeRow>) {
   const supabase = supabaseAdmin; 
   
   // Get current max sort order
   const { data: maxPrize } = await supabase
     .from('spin_prizes')
     .select('sort_order')
     .order('sort_order', { ascending: false })
     .limit(1)
     .single();
   
   const nextOrder = (maxPrize?.sort_order ?? -1) + 1;
   
   const cleaned = cleanPayload({ ...payload, sort_order: nextOrder });
   
   const { data, error } = await supabase
     .from('spin_prizes')
     .insert([cleaned])
     .select(); 
   
   if (error) throw error;
   revalidatePath('/admin/prizes');
   revalidatePath('/spin-to-win');
   return data?.[0];
}

export async function updateSpinPrize(id: string, payload: Partial<SpinPrizeRow>) {
  const supabase = supabaseAdmin; 
  const cleaned = cleanPayload(payload);

  const { data, error } = await supabase
    .from('spin_prizes')
    .update(cleaned)
    .match({ id })
    .select();

  if (error) throw error;
  revalidatePath('/admin/prizes');
  revalidatePath('/spin-to-win');
  return data?.[0];
}

export async function deleteSpinPrize(id: string) {
  const supabase = supabaseAdmin; 
  const { error } = await supabase
    .from('spin_prizes')
    .delete()
    .match({ id });

  if (error) throw error;
  revalidatePath('/admin/prizes');
  revalidatePath('/spin-to-win');
  return true;
}

export async function updatePrizeOrder(updates: { id: string, sort_order: number }[]) {
    const supabase = supabaseAdmin;
    
    // Perform individual updates for each prize
    // In a production app with many rows, you might use a more optimized approach,
    // but for spin prizes (usually < 20 rows), this is fine.
    for (const update of updates) {
        await supabase
            .from('spin_prizes')
            .update({ sort_order: update.sort_order })
            .eq('id', update.id);
    }
    
    revalidatePath('/admin/prizes');
    revalidatePath('/spin-to-win');
    return { success: true };
}
