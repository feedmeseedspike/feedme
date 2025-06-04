"use server";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "src/utils/database.types";

const ITEMS_PER_PAGE = 10; // Define items per page, consistent with previous logic

export async function getPromotions() {
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data: promotions, error } = await supabase
    .from("promotions")
    .select("*") // Select all columns for now
    .eq("is_active", true); // Fetch only active promotions

  if (error) {
    console.error("Error fetching promotions:", error.message);
    // Depending on how you want to handle errors, you might throw it
    // throw new Error("Failed to fetch promotions.");
    return []; // Return empty array on error for now
  }

  return promotions;
}

export async function createPromotion(promotionData: Database['public']['Tables']['promotions']['Insert']) {
  const supabase = createServerComponentClient<Database>({ cookies });

  // Remove the id from the insert data, as it has a default value in the DB
  const { id, ...insertData } = promotionData;

  const { data: newPromotion, error } = await supabase
    .from("promotions")
    .insert([insertData]) // insert expects an array of objects
    .select()
    .single(); // Get the newly created row

  if (error) {
    console.error("Error creating promotion:", error.message);
    throw new Error("Failed to create promotion."); // Throw the error to be caught by mutation hook
  }

  return newPromotion;
}

export async function getProductsByTag({
  tag,
  page = 1,
  sort = 'created_at',
}: {
  tag: string;
  page?: number;
  sort?: string;
}) {
  const supabase = createServerComponentClient<Database>({ cookies });

  // Determine sorting order and column
  let sortColumn = 'created_at';
  let ascending = false; // Default to newest first

  switch (sort) {
    case 'price-low-to-high':
      sortColumn = 'price';
      ascending = true;
      break;
    case 'price-high-to-low':
      sortColumn = 'price';
      ascending = false;
      break;
    case 'newest-arrivals':
      sortColumn = 'created_at';
      ascending = false; // Newest first
      break;
    case 'best-selling':
      sortColumn = 'num_sales'; // Corrected column name based on products table
      ascending = false;
      break;
    // Add other sort cases if needed
    default:
      sortColumn = 'created_at';
      ascending = false;
  }

  // First, find the promotion ID based on the tag
  const { data: promotionData, error: promotionError } = await supabase
    .from("promotions")
    .select("id")
    .eq("tag", tag)
    .single();

  if (promotionError || !promotionData) {
    console.error("Error finding promotion by tag:", promotionError?.message || 'Promotion not found');
    return { products: [], totalCount: 0 }; // Return empty array and count if promotion not found or error occurs
  }

  const promotionId = promotionData.id;

  // Now, find all product IDs linked to this promotion ID with count
  const { data: promotionProducts, error: ppError, count } = await supabase
    .from("promotion_products")
    .select("product_id", { count: 'exact' })
    .eq("promotion_id", promotionId);

  if (ppError) {
    console.error("Error fetching promotion products:", ppError.message);
    return { products: [], totalCount: 0 };
  }

  const productIds = promotionProducts?.map(item => item.product_id) || [];

  if (productIds.length === 0) {
    return { products: [], totalCount: 0 }; // No products linked to this promotion
  }

  // Calculate pagination range
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE - 1;

  // Finally, fetch the product details for these product IDs with sorting and pagination
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*") // Select all product details
    .in("id", productIds)
    .order(sortColumn as any, { ascending: ascending }) // Apply sorting, casting to any as column might be dynamic
    .range(startIndex, endIndex);

  if (productsError) {
    console.error("Error fetching products by IDs with pagination/sorting:", productsError.message);
    return { products: [], totalCount: count || 0 };
  }

  return { products, totalCount: count || 0 };
}

export async function getPromotionByTag(tag: string) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data: promotion, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("tag", tag)
    .single();

  if (error) {
    console.error("Error fetching promotion by tag:", error.message);
    // Depending on how you want to handle errors, you might throw it
    // throw new Error("Failed to fetch promotion.");
    return null; // Return null if promotion not found or error occurs
  }

  return promotion;
}

export async function deletePromotion(id: string) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const { error } = await supabase.from('promotions').delete().eq('id', id);

  if (error) {
    console.error('Error deleting promotion:', error);
    // Depending on your error handling strategy, you might throw the error
    // throw new Error("Failed to delete promotion.");
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updatePromotion(promotionData: Database['public']['Tables']['promotions']['Update']) {
  const supabase = createServerComponentClient<Database>({ cookies });

  if (!promotionData.id) {
    throw new Error("Promotion ID is required for updating.");
  }

  const { id, ...updateData } = promotionData; // Separate ID from update data

  const { data: updatedPromotion, error } = await supabase
    .from('promotions')
    .update(updateData) // Use the update data
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating promotion:', error.message);
    throw new Error(`Failed to update promotion: ${error.message}`);
  }

  return updatedPromotion;
}

export async function addProductToPromotion(promotionId: string, productId: string) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data, error } = await supabase
    .from('promotion_products')
    .insert([{ promotion_id: promotionId, product_id: productId }])
    .select()
    .single();

  if (error) {
    // Handle case where the product is already linked (duplicate key error)
    if (error.code === '23505') { // Unique violation error code for PostgreSQL
      console.warn(`Product ${productId} is already linked to promotion ${promotionId}.`);
      return { success: false, error: 'Product is already linked to this promotion.' };
    } else {
      console.error('Error adding product to promotion:', error.message);
      throw new Error(`Failed to add product to promotion: ${error.message}`);
    }
  }

  return { success: true, data };
}

export async function removeProductFromPromotion(promotionId: string, productId: string) {
  const supabase = createServerComponentClient<Database>({ cookies });

  const { error } = await supabase
    .from('promotion_products')
    .delete()
    .eq('promotion_id', promotionId)
    .eq('product_id', productId);

  if (error) {
    console.error('Error removing product from promotion:', error.message);
    throw new Error(`Failed to remove product from promotion: ${error.message}`);
  }

  return { success: true };
}

export async function getLinkedProductsForPromotion(promotionId: string) {
  const supabase = createServerComponentClient<Database>({ cookies });

  // Fetch promotion_products entries for the given promotionId and join with the products table
  const { data, error } = await supabase
    .from('promotion_products')
    .select('*, products(*)') // Select all from promotion_products and join product details
    .eq('promotion_id', promotionId);

  if (error) {
    console.error('Error fetching linked products:', error.message);
    throw new Error(`Failed to fetch linked products: ${error.message}`);
  }

  // The data will be an array like [{ promotion_id: ..., product_id: ..., products: { id: ..., name: ..., ... } }]
  // We want to return just the product details.
  return data.map(item => item.products);
}

export async function searchProducts(searchTerm: string) {
  const supabase = createServerComponentClient<Database>({ cookies });

  // Perform a case-insensitive search on the product name
  // You might want to add more fields to search on (e.g., description, SKU)
  const { data, error } = await supabase
    .from('products')
    .select('id, name, images') // Select relevant product fields, corrected image column
    .ilike('name', `%${searchTerm}%`); // Case-insensitive search

  if (error) {
    console.error('Error searching products:', error.message);
    throw new Error(`Failed to search products: ${error.message}`);
  }

  return data;
} 