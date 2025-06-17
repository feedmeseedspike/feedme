import { TypedSupabaseClient } from '../utils/types'
import { Tables } from "@utils/database.types";
import { createClient } from "@utils/supabase/client";

const supabase = createClient();

export async function getAllProducts(client: TypedSupabaseClient, {
  query,
  limit = 10,
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
  console.log("Executing getAllProducts from src/queries/products.ts with params:", { query, limit, page, category, tag, price, rating, sort, timeout });
  let queryBuilder = client
    .from('products')
    .select('*')
    .eq('is_published', true);

  // console.log(`getAllProducts: Current tag value before filter: '${tag}'`);
  // if (tag && tag !== 'all') {
  //   queryBuilder = queryBuilder.contains('tags', [tag]);
  //   console.log(`getAllProducts: Applying tag filter - tag: '${tag}'`);
  // }

  // Commenting out other filters for debugging
  // if (query && query !== 'all') {
  //   queryBuilder = queryBuilder.ilike('name', `%${query}%`);
  // }

  // if (category && category !== 'all') {
  //   queryBuilder = queryBuilder.contains('category_ids', [category]);
  // }

  // if (rating && rating !== 'all') {
  //   queryBuilder = queryBuilder.gte('avg_rating', Number(rating));
  // }

  // if (price && price !== 'all') {
  //   const [minPrice, maxPrice] = price.split('-').map(Number);
  //   queryBuilder = queryBuilder.gte('price', minPrice).lte('price', maxPrice);
  // }

  // const sortingOptions: Record<string, { column: string; ascending: boolean }> = {
  //   'best-selling': { column: 'num_sales', ascending: false },
  //   'price-low-to-high': { column: 'price', ascending: true },
  //   'price-high-to-low': { column: 'price', ascending: false },
  //   'avg-customer-review': { column: 'avg_rating', ascending: false },
  // };

  // if (sort && sortingOptions[sort]) {
  //   queryBuilder = queryBuilder.order(sortingOptions[sort].column, { ascending: sortingOptions[sort].ascending });
  // } else {
  queryBuilder = queryBuilder.order('id', { ascending: true }); // Keep a default order
  // }

  // Apply limit and pagination after all filters and sorts
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  queryBuilder = queryBuilder.range(from, to);
  console.log(`getAllProducts: Applying range from ${from} to ${to} with limit ${limit} and page ${page}`);

  let data, error;
  console.log("Supabase queryBuilder before await (with all filters applied - inspect this object for the URL in browser console):", queryBuilder);

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

    console.log("Supabase query raw response - data:", data);
    console.log("Supabase query raw response - error:", error);
  } catch (e) {
    console.error("Error during Supabase query execution (caught by try-catch or timeout):", e);
    throw e; // Re-throw to propagate the error
  }

  if (error) {
    console.error("Error executing getAllProducts query:", error);
    throw error;
  }

  // Handle data being null
  if (data === null) {
    console.warn("getAllProducts from src/queries/products.ts returned null data. Returning empty array.");
    return {
      products: [],
      totalPages: 0,
      totalProducts: 0,
      from: (page - 1) * limit + 1,
      to: (page - 1) * limit,
    };
  }

  // Fetch total count for pagination if data is not null
  const { count: totalCount, error: countError } = await client.from('products').select('*', { count: 'exact', head: true });
  if (countError) {
    console.error("Error fetching total product count:", countError);
    // Decide how to handle this - either throw or return a partial result
  }

  console.log("getAllProducts from src/queries/products.ts returning data:", data);

  return {
    products: data,
    totalPages: totalCount ? Math.ceil(totalCount / limit) : 0,
    totalProducts: totalCount || 0,
    from: (page - 1) * limit + 1,
    to: (page - 1) * limit + data.length,
  };
}

// Query function for getting products by tag
export function getProductsByTagQuery(client: TypedSupabaseClient, tag: string, limit?: number) {
  console.log("getProductsByTagQuery: Processing tag:", tag);
  let query = client
    .from('products')
    .select('*')
    .eq('is_published', true);

  // Always apply the tag filter
  if (tag && tag !== 'all') {
    query = query.contains('tags', [tag]);
    console.log("getProductsByTagQuery: Applying tag filter with contains for tag:", tag);
  }

  // Apply specific sorting if applicable
  if (tag === 'new-arrival') {
    query = query.order('created_at', { ascending: false });
    console.log("getProductsByTagQuery: Applying new-arrival order.");
  } else if (tag === 'best-seller') {
    query = query.order('num_sales', { ascending: false });
    console.log("getProductsByTagQuery: Applying best-seller order.");
  }

  if (limit) {
    query = query.limit(limit);
    console.log("getProductsByTagQuery: Applying limit:", limit);
  }

  console.log("getProductsByTagQuery: Final query builder before return:", query);
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

  // Limit results to a reasonable number for the modal to avoid fetching too much data
  queryBuilder = queryBuilder.limit(50); // Adjust limit as needed

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Error fetching products for bundle modal:', error);
    throw error;
  }

  return data;
}

export async function getProducts({
  page = 1,
  limit = 10,
  search = "",
  category = "",
}: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
}) {
  const offset = (page - 1) * limit;

  let query = supabase.from("products").select("*, categories(name)", { count: "exact" });

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (category) {
    query = query.contains("category_ids", [category]);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) throw error;

  return { data, count };
}

export async function getProductById(id: string) {
  const { data, error } = await supabase.from("products").select("*, categories(name)").eq("id", id).single();
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
    console.error("Error fetching category by ID:", error);
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
    console.error('Error fetching purchased product IDs:', error);
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
    console.error('Error fetching browsing history:', historyError);
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
    console.error('Error fetching also viewed products:', productsError);
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
    console.error('Error fetching order items for also bought products:', orderItemsError);
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
    console.error('Error fetching other order items for also bought products:', otherOrderItemsError);
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
    console.error('Error fetching details for also bought products:', productsError);
    throw productsError;
  }

  return products;
}