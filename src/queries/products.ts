import { TypedSupabaseClient } from '../utils/types'
import { Tables } from "@utils/database.types";
import { createClient } from "@utils/supabase/client";

const supabase = createClient();

export async function getAllProducts(client: TypedSupabaseClient, {
  query,
  limit = 20,
  page = 1,
  category,
  tag,
  price,
  rating,
  sort,
  timeout = 30000,
}: {
  query?: string;
  category?: string;
  tag?: string;
  limit?: number;
  page?: number;
  price?: string;
  rating?: string;
  sort?: string;
  timeout?: number;
}) {
  let queryBuilder = client
    .from('products')
    .select('*')
    .eq('is_published', true)
    .eq('in_season', true);

  // Apply tag filter if provided
  if (tag === 'new-arrival') {
    queryBuilder = queryBuilder.order('created_at', { ascending: false });
    // Do NOT filter by tags for new-arrival, just sort by created_at
  } else if (tag && tag !== 'all') {
    queryBuilder = queryBuilder.contains('tags', [tag]);
  }

  queryBuilder = queryBuilder.order('id', { ascending: true }); // Keep a default order

  // Apply limit and pagination after all filters and sorts
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  queryBuilder = queryBuilder.range(from, to);

  let data, error;

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Supabase query timed out after ${timeout / 1000} seconds.`)), timeout)
    );
    
    // Use Promise.race to race the query against the timeout
    const result = await Promise.race([
      queryBuilder, // The actual Supabase query
      timeoutPromise, // The timeout
    ]);

    // If we reach here, the query resolved before the timeout
    data = result.data;
    error = result.error;

  } catch (e) {
    throw e; // Re-throw to propagate the error
  }

  if (error) {
    throw error;
  }

  // Handle data being null
  if (data === null) {
    return {
      products: [],
      totalPages: 0,
      totalProducts: 0,
      from: (page - 1) * limit + 1,
      to: (page - 1) * limit,
    };
  }

  // Fetch total count for pagination if data is not null
  let countQuery = client.from('products').select('*', { count: 'exact', head: true }).eq('is_published', true);
  if (tag === 'new-arrival') {
    // no tag filter
  } else if (tag && tag !== 'all') {
    countQuery = countQuery.contains('tags', [tag]);
  }
  const { count: totalCount, error: countError } = await countQuery;
  if (countError) {
    // Decide how to handle this - either throw or return a partial result
  }

  return {
    products: data,
    totalPages: totalCount ? Math.ceil(totalCount / limit) : 0,
    totalProducts: totalCount || 0,
    from: (page - 1) * limit + 1,
    to: (page - 1) * limit + data.length,
  };
}

// Query function for getting products by tag
export function getProductsByTagQuery(client: TypedSupabaseClient, tag: string, limit: number = 20) {
  let query = client
    .from('products')
    .select('*')
    .eq('is_published', true);

  // For new-arrival, do NOT filter by tags, just sort by created_at
  if (tag === 'new-arrival') {
    query = query.order('created_at', { ascending: false });
  } else if (tag && tag !== 'all') {
    query = query.contains('tags', [tag]);
  }

  // Apply specific sorting if applicable
  if (tag === 'best-seller') {
    query = query.order('num_sales', { ascending: false });
  }

  if (limit) {
    query = query.limit(limit);
  }

  return query;
}

interface FetchProductsForBundleModalParams {
  search?: string;
}

export async function fetchProductsForBundleModal(client: TypedSupabaseClient, { search = '' }: FetchProductsForBundleModalParams): Promise<Tables<'products'>[] | null> {
  let queryBuilder = client
    .from('products')
    .select('*')
    .eq('is_published', true);

  if (search) {
    queryBuilder = queryBuilder.ilike('name', `%{search}%`);
  }

  queryBuilder = queryBuilder.limit(50); 

  const { data, error } = await queryBuilder;

  if (error) {
    throw error;
  }

  return data;
}

export async function getProducts({
  page = 1,
  limit = 10,
  search = "",
  category = "",
  stockStatus = "",
  publishedStatus = "",
  sortBy = "created_at",
  sortOrder = "desc",
}: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  stockStatus?: string;
  publishedStatus?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const offset = (page - 1) * limit;

  // Build the query  
  let query = supabase.from("products").select("*", { count: "exact" });

  // Apply search filter - search across name, description, and brand
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,brand.ilike.%${search}%`);
  }

  // Apply category filter
  if (category) {
    query = query.contains("category_ids", [category]);
  }

  // Apply stock status filter
  if (stockStatus) {
    if (stockStatus === "In stock") {
      query = query.eq("stock_status", "in_stock");
    } else if (stockStatus === "Out of stock") {
      query = query.eq("stock_status", "out_of_stock");
    }
  }

  // Apply published status filter
  if (publishedStatus) {
    if (publishedStatus === "Published") {
      query = query.eq("is_published", true);
    } else if (publishedStatus === "Archived") {
      query = query.eq("is_published", false);
    }
  }

  // Apply sorting
  const validSortFields = [
    "name", "price", "created_at", "updated_at", "num_sales", 
    "num_reviews", "avg_rating", "stock_status", "is_published"
  ];
  
  if (validSortFields.includes(sortBy)) {
    query = query.order(sortBy, { ascending: sortOrder === "asc" });
  } else {
    // Default sorting by created_at desc
    query = query.order("created_at", { ascending: false });
  }

  // Apply pagination
  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) throw error;

  return { data, count };
}

export async function getProductById(id: string) {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase.from("products").select("*, categories(name)").eq("slug", slug).single();
  if (error) throw error;
  return data;
}

export async function countProducts() {
  const { count, error } = await supabase.from("products").select("*", { count: "exact" });
  if (error) throw error;
  return count;
}

export async function getAllCategories() {
  const { data, error } = await supabase.from("categories").select("*");
  if (error) throw error;
  return data;
}

export async function getCategoryById(id: string) {
  const { data, error } = await supabase.from("categories").select("*").eq("id", id).single();

  if (error) {
    throw error;
  }
  return data;
}

export async function getUsersPurchasedProductIds(client: TypedSupabaseClient, userId: string) {
  const { data, error } = await client
    .from('order_items')
    .select('product_id, orders!inner(user_id)')
    .eq('orders.user_id', userId);

  if (error) {
    throw error;
  }

  // Extract unique product_ids
  const purchasedProductIds = data.map((item) => item.product_id).filter(Boolean) as string[];
  return [...new Set(purchasedProductIds)];
}

export async function getAlsoViewedProducts(client: TypedSupabaseClient, currentProductId: string) {
  const { data: historyData, error: historyError } = await client
    .from('browsing_history')
    .select('product_id')
    .neq('product_id', currentProductId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (historyError) {
    // Optionally, handle this error more gracefully, e.g., return empty array or fewer recommendations
  }

  const productIds = historyData?.map(item => item.product_id).filter(Boolean) as string[];

  if (!productIds || productIds.length === 0) {
    return [];
  }

  const { data: products, error: productsError } = await client
    .from('products')
    .select('*')
    .in('id', productIds)
    .eq('is_published', true)
    .limit(5); // Ensure we only get up to 5 recommended products

  if (productsError) {
    throw productsError;
  }

  return products;
}

export async function getAlsoBoughtProducts(client: TypedSupabaseClient, currentProductId: string) {
  // First, find orders that contain the current product
  const { data: orderItemsData, error: orderItemsError } = await client
    .from('order_items')
    .select('order_id')
    .eq('product_id', currentProductId)
    .limit(10); // Limit to recent orders for performance

  if (orderItemsError) {
    // Optionally, handle this error more gracefully
  }

  const orderIds = orderItemsData?.map(item => item.order_id).filter(Boolean) as string[];

  if (!orderIds || orderIds.length === 0) {
    return [];
  }

  // Then, find other products in those same orders
  const { data: otherOrderItemsData, error: otherOrderItemsError } = await client
    .from('order_items')
    .select('product_id')
    .in('order_id', orderIds)
    .neq('product_id', currentProductId) // Exclude the current product itself
    .limit(10); // Limit results for performance

  if (otherOrderItemsError) {
    // Optionally, handle this error more gracefully
  }

  const productIds = otherOrderItemsData?.map(item => item.product_id).filter(Boolean) as string[];

  if (!productIds || productIds.length === 0) {
    return [];
  }

  // Finally, fetch the product details for the identified products
  const { data: products, error: productsError } = await client
    .from('products')
    .select('*')
    .in('id', [...new Set(productIds)]) // Use Set to get unique product IDs
    .eq('is_published', true)
    .limit(5); // Ensure we only get up to 5 recommended products

  if (productsError) {
    throw productsError;
  }

  return products;
}

export async function deleteProduct(id: string) {
  const supabase = createClient();

  // Only delete the product from the 'products' table
  const { error: deleteProductError } = await supabase.from('products').delete().eq('id', id);
  if (deleteProductError) {
    throw deleteProductError;
  }
  return true;
}