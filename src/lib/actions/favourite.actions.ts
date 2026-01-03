"use server";

import { createClient } from "src/utils/supabase/server";
import { Tables } from "src/utils/database.types";

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

    if (error?.code === '23505') {
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

export async function getFavoritesCount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count, error } = await supabase
    .from('favorites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (error) return 0;

  return count || 0;
}

export async function getFavourites(): Promise<FavoritesSuccess | FavoritesFailure> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { 
      success: false, 
      error: "You must be logged in to view favorites",
      data: null
    };
  }

  try {
    const { data: favorites, error } = await supabase
      .from('favorites')
      .select(`
        id, 
        user_id, 
        product_id, 
        created_at, 
        products (
          id,
          name,
          slug,
          description,
          price,
          list_price,
          brand,
          avg_rating,
          num_reviews,
          num_sales,
          count_in_stock,
          stock_status,
          is_published,
          created_at,
          updated_at,
          vendor_id,
          category_ids,
          tags,
          images,
          options,
          rating_distribution,
          in_season
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // console.log("getFavourites raw data:", JSON.stringify(favorites, null, 2));
    // console.log("getFavourites error:", error);

    if (error) throw error;

    return { 
      success: true, 
      data: (favorites || []).map(fav => ({
        ...fav,
        products: fav.products as any || null,
      })) as any,
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