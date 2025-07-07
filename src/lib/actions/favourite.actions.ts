"use server";

import { createClient } from "src/utils/supabase/server";
import { Tables } from "src/utils/database.types"; // Import Tables for typing

// Define explicit return types for success and failure scenarios
export type FavoritesSuccess = { 
  success: true; 
  data: { 
    id: string;
    user_id: string | null;
    product_id: string | null;
    created_at: string | null;
    products: Tables<'products'> | null;
  }[]; 
  error: null 
};
export type FavoritesFailure = { success: false; data: null; error: string };

// Add to favorites with error handling
export async function addToFavorite(productId: string): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { 
      success: false, 
      error: "You must be logged in to add favorites" 
    };
  }

  try {
    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        product_id: productId
      });

    if (error?.code === '23505') { // Unique violation
      return { 
        success: false, 
        error: "This product is already in your favorites" 
      };
    }

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || "Failed to add to favorites" 
    };
  }
}

// Remove from favorites with error handling
export async function removeFromFavorite(productId: string): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { 
      success: false, 
      error: "You must be logged in to modify favorites" 
    };
  }

  try {
    // Find and delete the favorite record for the user and product
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || "Failed to remove from favorites" 
    };
  }
}

// Check favorite status with caching
export async function isProductFavorited(productId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();

  return !!data;
}

// Get favorites count with caching
export async function getFavoritesCount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count } = await supabase
    .from('favorites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return count || 0;
}

// Get favorites for the logged-in user
export async function getFavourites(): Promise<FavoritesSuccess | FavoritesFailure> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { 
      success: false, 
      error: "You must be logged in to view favorites",
      data: null // Explicitly add data: null for failure case
    };
  }

  try {
    // First get just the favorite records
    const { data: favorites, error } = await supabase
      .from('favorites')
      .select('id, user_id, product_id, created_at, products(*)') // Explicitly select fields and join products
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { 
      success: true, 
      data: (favorites || []).map(fav => ({
        ...fav,
        products: Array.isArray(fav.products) && fav.products.length > 0 ? fav.products[0] : null,
      })),
      error: null
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || "Failed to fetch favorites",
      data: null
    };
  }
}