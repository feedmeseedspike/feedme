import { TypedSupabaseClient } from '../utils/types'
import { Tables } from "@utils/database.types";
import { createClient } from "@utils/supabase/client";
import { expandSearchTerms, buildSearchFilter, sortProductsByRelevance } from '@/lib/search-utils';

type OrderItemResult = { product_id: string | null; };
type OrderIdResult = { order_id: string | null; };
type BrowsingHistoryItem = { product_id: string | null; };

// Helper to get a fresh client instance
const getSupabase = () => createClient();

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
    .eq('is_published', true);

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
      queryBuilder = queryBuilder.eq('in_season', true);
    } else if (season === 'false') {
      queryBuilder = queryBuilder.eq('in_season', false);
    }
  }

  // Apply tag filter if provided
  if (tag === 'new-arrival') {
    queryBuilder = queryBuilder.order('created_at', { ascending: false });
  } else if (tag && tag !== 'all') {
    queryBuilder = queryBuilder.contains('tags', [tag]);
  }

  // Apply sorting
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

  queryBuilder = queryBuilder.order('id', { ascending: true });

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  queryBuilder = queryBuilder.range(from, to);

  const { data, error } = await Promise.race([
    queryBuilder,
    new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Query timed out")), timeout))
  ]);

  if (error) throw error;

  if (!data) {
    return {
      products: [],
      totalPages: 0,
      totalProducts: 0,
      from: (page - 1) * limit + 1,
      to: (page - 1) * limit,
    };
  }

  // Fetch total count with same filters
  let countQuery = client.from('products').select('*', { count: 'exact', head: true }).eq('is_published', true);
  if (query && query !== 'all' && query !== '') {
    const terms = expandSearchTerms(query);
    const filter = buildSearchFilter(terms, ['name', 'description', 'brand']);
    countQuery = countQuery.or(filter);
  }
  if (category && category !== 'all') {
    countQuery = countQuery.contains('category_ids', [category]);
  }
  if (season && season !== 'all') {
    countQuery = countQuery.eq('in_season', season === 'true');
  }

  const { count: totalCount } = await countQuery;

  return {
    products: (query && query !== 'all' && !sort) ? sortProductsByRelevance(data || [], query) : (data || []),
    totalPages: totalCount ? Math.ceil(totalCount / limit) : 0,
    totalProducts: totalCount || 0,
    from: (page - 1) * limit + 1,
    to: (page - 1) * limit + data.length,
  };
}

export function getDiscountedProductsQuery(client: TypedSupabaseClient, limit: number = 20) {
  return client
    .from('products')
    .select('*')
    .eq('is_published', true)
    // Use proper Postgres array literal syntax (no spaces between elements)
    .filter('tags', 'ov', '{"discount:5%","discount:10%","discount:15%","discount:20%","discount:25%","discount:30%","discount:40%","discount:50%","discount:5","discount:10","discount:15","discount:20","discount:25","discount:30","discount:40","discount:50","Discount:5%","Discount:10%","Discount:15%","Discount:20%","Discount:25%","Discount:30%","Discount:40%","Discount:50%","Discount: 10 % discount","Discount: 5 % discount","Discount: 20 % discount"}')
    .limit(limit);
}

export function getProductsByTagQuery(client: TypedSupabaseClient, tag: string, limit: number = 20) {
  if (tag === 'discounted') {
    return getDiscountedProductsQuery(client, limit);
  }
  
  let query = client.from('products').select('*').eq('is_published', true);

  if (tag === 'new-arrival') {
    query = query.order('created_at', { ascending: false });
  } else if (tag && tag !== 'all') {
    query = query.contains('tags', [tag]);
  }

  if (tag === 'best-seller') {
    query = query.order('num_sales', { ascending: false });
  }

  if (limit) {
    query = query.limit(limit);
  }

  return query;
}

export async function fetchProductsForBundleModal(client: TypedSupabaseClient, { search = '' }: { search?: string }) {
  try {
    let queryBuilder = client.from('products').select('*').eq('is_published', true).in('in_season', [true, null]);
    if (search && search.trim() !== '') {
      const terms = expandSearchTerms(search);
      const filter = buildSearchFilter(terms, ['name', 'description', 'brand']);
      queryBuilder = queryBuilder.or(filter);
    }
    queryBuilder = queryBuilder.limit(50).order('name', { ascending: true });
    const { data, error } = await queryBuilder;
    if (error) throw error;
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
  const supabase = getSupabase();
  const offset = (page - 1) * limit;

  let query = supabase.from("products").select("*", { count: "exact" });

  if (search) {
    const terms = expandSearchTerms(search);
    const filter = buildSearchFilter(terms, ["name", "description", "brand"]);
    query = query.or(filter);
  }

  if (category) {
    query = query.contains("category_ids", [category]);
  }

  if (stockStatus) {
    query = query.eq("stock_status", stockStatus === "In stock" ? "in_stock" : "out_of_stock");
  }

  if (publishedStatus) {
    query = query.eq("is_published", publishedStatus === "Published");
  }

  const validSortFields = ["name", "price", "created_at", "updated_at", "num_sales", "num_reviews", "avg_rating", "stock_status", "is_published"];
  if (validSortFields.includes(sortBy)) {
    query = query.order(sortBy, { ascending: sortOrder === "asc" });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);
  if (error) throw error;

  let finalData = data || [];
  if (search && (!sortBy || sortBy === "created_at")) {
    finalData = sortProductsByRelevance(finalData, search);
  }

  return { data: finalData, count };
}

export async function getProductById(id: string) {
  const { data, error } = await getSupabase().from("products").select("*").eq("id", id).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProductBySlug(slug: string) {
  const { data, error } = await getSupabase().from("products").select("*, categories(name)").eq("slug", slug).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function countProducts() {
  const { count, error } = await getSupabase().from("products").select("*", { count: "exact" });
  if (error) throw error;
  return count;
}

export async function getAllCategories() {
  const { data, error } = await getSupabase().from("categories").select("*");
  if (error) throw error;
  return data;
}

export async function getCategoryById(id: string) {
  const { data, error } = await getSupabase().from("categories").select("*").eq("id", id).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getUsersPurchasedProductIds(client: TypedSupabaseClient, userId: string) {
  const { data, error } = await client.from('order_items').select('product_id, orders!inner(user_id)').eq('orders.user_id', userId);
  if (error) throw error;
  const ids = data.map((item: any) => item.product_id).filter(Boolean);
  return [...new Set(ids)];
}

export async function getAlsoViewedProducts(client: TypedSupabaseClient, currentProductId: string) {
  const { data: userData, error: userError } = await client.from('browsing_history').select('user_id').eq('product_id', currentProductId).neq('user_id', null).order('created_at', { ascending: false }).limit(50);
  let sortedProducts: any[] = [];
  if (!userError && userData && userData.length > 0) {
      const userIds = [...new Set(userData.map(u => u.user_id))];
      if (userIds.length > 0) {
          const { data: otherViews } = await client.from('browsing_history').select('product_id').in('user_id', userIds).neq('product_id', currentProductId).order('created_at', { ascending: false }).limit(100);
          if (otherViews && otherViews.length > 0) {
              const productFrequency: Record<string, number> = {};
              otherViews.forEach((view: any) => { if(view.product_id) productFrequency[view.product_id] = (productFrequency[view.product_id] || 0) + 1; });
              const topProductIds = Object.entries(productFrequency).sort(([, a], [, b]) => b - a).slice(0, 5).map(([id]) => id);
              if (topProductIds.length > 0) {
                  const { data: products } = await client.from('products').select('*').in('id', topProductIds).eq('is_published', true);
                  if (products) sortedProducts = topProductIds.map(id => products.find(p => p.id === id)).filter(Boolean);
              }
          }
      }
  }
  if (sortedProducts.length < 5) {
      const needed = 5 - sortedProducts.length;
      const existingIds = sortedProducts.map(p => p.id);
      existingIds.push(currentProductId);
      const { data: fallbackProducts } = await client.from('products').select('*').eq('is_published', true).not('id', 'in', `(${existingIds.join(',')})`).order('num_sales', { ascending: false }).limit(needed);
      if (fallbackProducts) sortedProducts = [...sortedProducts, ...fallbackProducts];
  }
  return sortedProducts;
}

export async function getAlsoBoughtProducts(client: TypedSupabaseClient, currentProductId: string) {
  const { data: orderItemsData } = await client.from('order_items').select('order_id').eq('product_id', currentProductId).limit(10);
  const orderIds = orderItemsData?.map((item: any) => item.order_id).filter(Boolean);
  if (!orderIds || orderIds.length === 0) return [];
  const { data: otherOrderItemsData } = await client.from('order_items').select('product_id').in('order_id', orderIds).neq('product_id', currentProductId).limit(10);
  const productIds = otherOrderItemsData?.map((item: any) => item.product_id).filter(Boolean);
  if (!productIds || productIds.length === 0) return [];
  const { data: products, error } = await client.from('products').select('*').in('id', [...new Set(productIds)]).eq('is_published', true).limit(5);
  if (error) throw error;
  return products;
}

export async function deleteProduct(id: string) {
  const supabase = getSupabase();
  return await Promise.race([
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: orderItem } = await supabase.from('order_items').select('id').eq('product_id', id).limit(1).maybeSingle();
      if (orderItem) throw new Error(`Cannot delete: product has order history.`);
      const childDeletions = [
        { table: 'promotion_products', filter: { product_id: id } },
        { table: 'bundle_products', filter: { product_id: id } },
        { table: 'black_friday_items', filter: { product_id: id } },
        { table: 'browsing_history', filter: { product_id: id } },
        { table: 'cart_items', filter: { product_id: id } },
        { table: 'spin_prizes', filter: { product_id: id } },
        { table: 'blog_recipe_products', filter: { product_id: id } },
        { table: 'product_reviews', filter: { product_id: id } },
        { table: 'favorites', filter: { product_id: id } },
        { table: 'product_relations', filter: { source_product_id: id } },
        { table: 'product_relations', filter: { target_product_id: id } },
      ];
      await Promise.allSettled(childDeletions.map(async (d) => {
        try {
          await supabase.from(d.table).delete().match(d.filter);
        } catch (e) {
          console.error(`Cleanup failed for ${d.table}:`, e);
        }
      }));
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        if (error.code === '23503') throw new Error("Product is still referenced in historical data.");
        throw error;
      }
      return true;
    })(),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Deletion timed out")), 30000))
  ]);
}