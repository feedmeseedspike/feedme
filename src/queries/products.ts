import { TypedSupabaseClient } from '../utils/types'
import { Tables } from "@utils/database.types";
import { createClient } from "@utils/supabase/client";
import { expandSearchTerms, buildSearchFilter, sortProductsByRelevance } from '@/lib/search-utils';

type OrderItemResult = { product_id: string | null; };
type OrderIdResult = { order_id: string | null; };
type BrowsingHistoryItem = { product_id: string | null; };

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
  season,
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
  season?: string;
  timeout?: number;
}) {
  let queryBuilder = client
    .from('products')
    .select('*')
    .eq('is_published', true)
    // .in('in_season', [true, null]); // Include both in_season=true and in_season=null

  // Apply search filter if provided
  if (query && query !== 'all' && query !== '') {
    const terms = expandSearchTerms(query);
    const filter = buildSearchFilter(terms, ['name', 'description', 'brand']);
    queryBuilder = queryBuilder.or(filter);
  }

  // Apply category filter if provided
  if (category && category !== 'all') {
    queryBuilder = queryBuilder.contains('category_ids', [category]);
  }

  // Apply price filter if provided
  if (price && price !== 'all') {
    const [minPrice, maxPrice] = price.split('-').map(Number);
    if (!isNaN(minPrice) && !isNaN(maxPrice)) {
      queryBuilder = queryBuilder.gte('price', minPrice).lte('price', maxPrice);
    }
  }

  // Apply season filter if provided
  if (season && season !== 'all') {
    if (season === 'true') {
      // Filter for products that are in season (true)
      queryBuilder = queryBuilder.eq('in_season', true);
    } else if (season === 'false') {
      // Filter for products that are explicitly out of season (false only)
      queryBuilder = queryBuilder.eq('in_season', false);
    }
  }

  // Apply tag filter if provided
  if (tag === 'new-arrival') {
    queryBuilder = queryBuilder.order('created_at', { ascending: false });
    // Do NOT filter by tags for new-arrival, just sort by created_at
  } else if (tag && tag !== 'all') {
    queryBuilder = queryBuilder.contains('tags', [tag]);
  }

  // Apply sorting (only if not already sorted by tag filter)
  if (tag !== 'new-arrival') {
    if (sort) {
      switch (sort) {
        case 'price-low-to-high':
          queryBuilder = queryBuilder.order('price', { ascending: true });
          break;
        case 'price-high-to-low':
          queryBuilder = queryBuilder.order('price', { ascending: false });
          break;
        case 'newest-arrivals':
          queryBuilder = queryBuilder.order('created_at', { ascending: false });
          break;
        case 'avg-customer-review':
          queryBuilder = queryBuilder.order('avg_rating', { ascending: false });
          break;
        case 'best-selling':
        default:
          queryBuilder = queryBuilder.order('num_sales', { ascending: false });
          break;
      }
    } else {
      queryBuilder = queryBuilder.order('num_sales', { ascending: false });
    }
  }

  // Add a secondary sort for consistency
  queryBuilder = queryBuilder.order('id', { ascending: true });

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
  
  // Apply the same filters to count query
  if (query && query !== 'all' && query !== '') {
    const terms = expandSearchTerms(query);
    const filter = buildSearchFilter(terms, ['name', 'description', 'brand']);
    countQuery = countQuery.or(filter);
  }
  
  if (category && category !== 'all') {
    countQuery = countQuery.contains('category_ids', [category]);
  }
  
  if (price && price !== 'all') {
    const [minPrice, maxPrice] = price.split('-').map(Number);
    if (!isNaN(minPrice) && !isNaN(maxPrice)) {
      countQuery = countQuery.gte('price', minPrice).lte('price', maxPrice);
    }
  }
  
  if (season && season !== 'all') {
    if (season === 'true') {
      // Filter for products that are in season (true)
      countQuery = countQuery.eq('in_season', true);
    } else if (season === 'false') {
      // Filter for products that are explicitly out of season (false only)
      countQuery = countQuery.eq('in_season', false);
    }
  }
  
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
    products: (query && query !== 'all' && !sort) ? sortProductsByRelevance(data || [], query) : (data || []),
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

export async function fetchProductsForBundleModal(client: TypedSupabaseClient, { search = '' }: FetchProductsForBundleModalParams): Promise<Tables<'products'>[]> {
  try {
    let queryBuilder = client
      .from('products')
      .select('*')
      .eq('is_published', true)
      .in('in_season', [true, null]); // Only include products that are in season or have no season status

    if (search && search.trim() !== '') {
      const terms = expandSearchTerms(search);
      const filter = buildSearchFilter(terms, ['name', 'description', 'brand']);
      queryBuilder = queryBuilder.or(filter);
    }

    queryBuilder = queryBuilder.limit(50).order('name', { ascending: true });

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Error fetching products for bundle modal:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchProductsForBundleModal:', error);
    throw error;
  }
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
    const terms = expandSearchTerms(search);
    const filter = buildSearchFilter(terms, ["name", "description", "brand"]);
    query = query.or(filter);
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

  // Apply relevance sorting if search query is provided and no specific sort field is used
  let finalData = data || [];
  if (search && (!sortBy || sortBy === "created_at")) {
    finalData = sortProductsByRelevance(finalData, search);
  }

  return { data: finalData, count };
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
  const purchasedProductIds = data.map((item: OrderItemResult) => item.product_id).filter(Boolean) as string[];
  return [...new Set(purchasedProductIds)];
}

export async function getAlsoViewedProducts(client: TypedSupabaseClient, currentProductId: string) {
  // 1. Find users who viewed this product (limit to last 50 distinct users for performance)
  const { data: userData, error: userError } = await client
    .from('browsing_history')
    .select('user_id')
    .eq('product_id', currentProductId)
    .neq('user_id', null) 
    .order('created_at', { ascending: false })
    .limit(50); 

  let sortedProducts: any[] = [];
  
  // Only proceed with collab filtering if we have user data
  if (!userError && userData && userData.length > 0) {
      // Extract unique user IDs
      const userIds = [...new Set(userData.map(u => u.user_id))];

      if (userIds.length > 0) {
          // 2. Find what ELSE these users viewed
          const { data: otherViews, error: otherViewsError } = await client
            .from('browsing_history')
            .select('product_id')
            .in('user_id', userIds)
            .neq('product_id', currentProductId)
            .order('created_at', { ascending: false })
            .limit(100); 

          if (!otherViewsError && otherViews && otherViews.length > 0) {
               // 3. Count frequency
              const productFrequency: Record<string, number> = {};
              otherViews.forEach((view: any) => {
                  if(view.product_id) {
                      productFrequency[view.product_id] = (productFrequency[view.product_id] || 0) + 1;
                  }
              });

              // 4. Sort by frequency and get top 5 IDs
              const topProductIds = Object.entries(productFrequency)
                  .sort(([, a], [, b]) => b - a) 
                  .slice(0, 5)
                  .map(([id]) => id);

              if (topProductIds.length > 0) {
                  // 5. Fetch full product details
                  const { data: products, error: productsError } = await client
                    .from('products')
                    .select('*')
                    .in('id', topProductIds)
                    .eq('is_published', true);

                  if (!productsError && products) {
                       sortedProducts = topProductIds
                        .map(id => products.find(p => p.id === id))
                        .filter(Boolean);
                  }
              }
          }
      }
  }

  // FALLBACK LOGIC: If we don't have 5 products yet, fill with Best Sellers
  if (sortedProducts.length < 5) {
      const needed = 5 - sortedProducts.length;
      const existingIds = sortedProducts.map(p => p.id);
      existingIds.push(currentProductId); // Exclude current

      const { data: fallbackProducts, error: fallbackError } = await client
        .from('products')
        .select('*')
        .eq('is_published', true)
        .not('id', 'in', `(${existingIds.join(',')})`) // Exclude existing
        .order('num_sales', { ascending: false }) // Best sellers
        .limit(needed);

      if (!fallbackError && fallbackProducts) {
          sortedProducts = [...sortedProducts, ...fallbackProducts];
      }
  }

  return sortedProducts;
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

  const orderIds = orderItemsData?.map((item: OrderIdResult) => item.order_id).filter(Boolean) as string[];

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

  const productIds = otherOrderItemsData?.map((item: OrderItemResult) => item.product_id).filter(Boolean) as string[];

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