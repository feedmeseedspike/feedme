"use server";

import { ProductInterface } from "@/utils/productsiinterface";
import { createClient } from "../../utils/supabase/server";
import { sendBroadcastNotification } from "./notifications.actions";
import { expandSearchTerms, buildSearchFilter, sortProductsByRelevance } from "@/lib/search-utils";

// Removed top-level supabase initialization

// export async function getAllCategories() {
//   const allCategories = await getCategories();
//   return allCategories;
// }

// export async function getProductsForCard({ tag, limit = 4 }: { tag: string; limit?: number }) {
//   const allProducts = await getProducts();
//   return allProducts
//     .filter((product) => product.tags?.includes(tag) && product.is_published)
//     .slice(0, limit)
//     .map(({ name, slug, images }) => ({
//       name,
//       href: `/product/${slug}`,
//       image: images?.[0],
//     }));
// }

export async function getTrendingProducts({ limit = 10 }: { limit?: number }) {
  const supabase = await createClient(); // Initialize client inside the function
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .contains("tags", ["trending"])
    .eq("is_published", true)
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getProduct(): Promise<ProductInterface[]> {
  const supabase = await createClient(); // Initialize client inside the function
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_published", true);
  if (error) throw error;
  return data as ProductInterface[];
}

export async function getFreshFruits({ limit = 10 }: { limit?: number }) {
  const supabase = await createClient(); // Initialize client inside the function
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .contains("tags", ["fresh-fruits"])
    .eq("is_published", true)
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getProductByTag({
  limit = 10,
  tag,
}: {
  limit?: number;
  tag: string;
}) {
  const supabase = await createClient(); // Initialize client inside the function
  if (tag === "new-arrival") {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .eq("is_published", true)
      .limit(limit);
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .contains("tags", [tag])
      .eq("is_published", true)
      .limit(limit);
    if (error) throw error;
    return data;
  }
}

export async function getBundle() {
  const supabase = await createClient(); // Initialize client inside the function
  const { data, error } = await supabase
    .from("bundles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getCategory() {
  const supabase = await createClient(); // Initialize client inside the function
  const { data, error } = await supabase.from("categories").select("*");
  if (error) throw error;
  return data;
}

export async function getBanner() {
  const supabase = await createClient(); // Initialize client inside the function
  const { data, error } = await supabase.from("banners").select("*");
  if (error) throw error;
  return data;
}

export async function getProductsByCategory({
  category,
  productId,
}: {
  category: string;
  productId: string;
}) {
  const supabase = await createClient(); // Initialize client inside the function
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .contains("category_ids", [category])
    // .neq("id", productId)
    .eq("is_published", true)
    .order("num_sales", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getFreshVegetables({ limit = 10 }: { limit?: number }) {
  const supabase = await createClient(); // Initialize client inside the function
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .contains("tags", ["fresh-vegetables"])
    .eq("is_published", true)
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getProductsByTag({
  tag,
  limit = 10,
}: {
  tag: string;
  limit?: number;
}) {
  const supabase = await createClient(); // Initialize client inside the function
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .contains("tags", [tag])
    .eq("is_published", true)
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getProductBySlug(slug: string) {
  try {
    const supabase = await createClient(); // Initialize client inside the function
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error; // Re-throw to ensure the error propagates
  }
}

export async function getRelatedProductsByCategory({
  category,
  productId,
  limit = 4,
  page = 1,
}: {
  category: string;
  productId: string;
  limit?: number;
  page: number;
}) {
  const supabase = await createClient(); // Initialize client inside the function
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .contains("category_ids", [category])
    .neq("id", productId)
    .eq("is_published", true)
    .order("num_sales", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  if (error) throw error;
  return {
    data,
    totalPages: Math.ceil(data.length / limit),
  };
}

export async function getProductsServer({
  query,
  limit = 10,
  page = 1,
  category,
  tag,
  price,
  rating,
  sort,
}: {
  query?: string;
  category?: string;
  tag?: string;
  limit?: number;
  page?: number;
  price?: string;
  rating?: string;
  sort?: string;
}) {
  const supabase = await createClient(); // Initialize client inside the function
  // Build the base query for counting
  let countQuery = supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true);

  if (query && query !== "all") {
    countQuery = countQuery.ilike("name", `%${query}%`);
  }
  if (category && category !== "all") {
    countQuery = countQuery.contains("category_ids", [category]);
  }
  if (tag && tag !== "all") {
    countQuery = countQuery.contains("tags", [tag]);
  }
  if (rating && rating !== "all") {
    countQuery = countQuery.gte("avg_rating", Number(rating));
  }
  if (price && price !== "all") {
    const [minPrice, maxPrice] = price.split("-").map(Number);
    countQuery = countQuery.gte("price", minPrice).lte("price", maxPrice);
  }

  const { count, error: countError } = await countQuery;
  if (countError) {
    throw countError;
  }

  // Build the paginated query
  let queryBuilder = supabase
    .from("products")
    .select("*")
    .eq("is_published", true);

  if (query && query !== "all") {
    queryBuilder = queryBuilder.ilike("name", `%${query}%`);
  }
  if (category && category !== "all") {
    queryBuilder = queryBuilder.contains("category_ids", [category]);
  }
  if (tag && tag !== "all") {
    queryBuilder = queryBuilder.contains("tags", [tag]);
  }
  if (rating && rating !== "all") {
    queryBuilder = queryBuilder.gte("avg_rating", Number(rating));
  }
  if (price && price !== "all") {
    const [minPrice, maxPrice] = price.split("-").map(Number);
    queryBuilder = queryBuilder.gte("price", minPrice).lte("price", maxPrice);
  }

  const sortingOptions: Record<string, { column: string; ascending: boolean }> =
    {
      "best-selling": { column: "num_sales", ascending: false },
      "price-low-to-high": { column: "price", ascending: true },
      "price-high-to-low": { column: "price", ascending: false },
      "avg-customer-review": { column: "avg_rating", ascending: false },
    };

  if (sort && sortingOptions[sort]) {
    queryBuilder = queryBuilder.order(sortingOptions[sort].column, {
      ascending: sortingOptions[sort].ascending,
    });
  } else {
    queryBuilder = queryBuilder.order("id", { ascending: true });
  }

  const { data, error } = await queryBuilder.range(
    (page - 1) * limit,
    page * limit - 1
  );
  if (error) {
    throw error;
  }

  return {
    products: data,
    totalPages: Math.ceil((count || 0) / limit),
    totalProducts: count || 0,
    from: (page - 1) * limit + 1,
    to: Math.min(page * limit, count || 0),
  };
}

export async function getAllTags() {
  const supabase = await createClient(); // Initialize client inside the function
  const allProductsResponse = await getProductsServer({});
  const allProducts = allProductsResponse?.products || [];
  return Array.from(
    new Set(allProducts.flatMap((product: any) => product.tags || []))
  )
    .sort((a, b) => a.localeCompare(b))
    .map((tag) =>
      tag
        .split("-")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );
}

export async function addProduct(product: any) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert([product])
    .select();
  if (error) {
    throw error;
  }

  // Notify all users about the new arrival
  try {
    await sendBroadcastNotification({
      type: "info",
      title: "New Arrival",
      body: `${product.name} is now available! 🛒`,
      link: `/product/${data?.[0].slug}`
    });
  } catch (err) {
    console.warn("Broadcast (New Product) failed:", err);
  }

  return data?.[0];
}

export async function updateProduct(id: string, product: any) {
  const supabase = await createClient(); // Initialize client inside the function
  const { data, error } = await supabase
    .from("products")
    .update(product)
    .eq("id", id)
    .select();
  if (error) {
    throw error;
  }

  // If price was updated, notify users
  if (product.price !== undefined) {
    try {
      await sendBroadcastNotification({
        type: "info",
        title: "Price Alert",
        body: `The price of ${data?.[0].name} has been updated. Check it out now! 💰`,
        link: `/product/${data?.[0].slug}`
      });
    } catch (err) {
      console.warn("Broadcast (Price Update) failed:", err);
    }
  }

  return data?.[0];
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    throw error;
  }
  return true;
}
export async function getProductsBySearch(query: string, limit = 10) {
  const supabase = await createClient();
  const terms = expandSearchTerms(query);
  const filter = buildSearchFilter(terms, ["name", "description", "brand"]);
  const { data, error } = await supabase
    .from("products")
    .select("id, slug, name, images")
    .or(filter)
    .eq("is_published", true)
    .limit(limit);
  if (error) throw error;
  
  // Sort by relevance to ensure exact matches come first
  const sortedData = sortProductsByRelevance(data || [], query);
  
  // Prefer the first image if available
  return sortedData.map((p: any) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    image: Array.isArray(p.images) ? p.images[0] : p.images || null,
  }));
}

export async function getCategoriesBySearch(query: string, limit = 5) {
  const supabase = await createClient();
  const terms = expandSearchTerms(query);
  
  // Build filter for categories (title column)
  const filters = terms.map(term => `title.ilike.%${term.replace(/[%_]/g, '\\$&')}%`).join(',');
  
  const { data, error } = await supabase
    .from("categories")
    .select("id, title, thumbnail")
    .or(filters)
    .limit(limit);
    
  if (error) throw error;
  
  // Sort by relevance (manual sort since we have little data usually)
  const normalizedQuery = query.toLowerCase().trim();
  return (data || []).sort((a, b) => {
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();
    if (aTitle === normalizedQuery) return -1;
    if (bTitle === normalizedQuery) return 1;
    if (aTitle.startsWith(normalizedQuery)) return -1;
    if (bTitle.startsWith(normalizedQuery)) return 1;
    return 0;
  });
}

export async function getProductById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getAllCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, title, thumbnail");
  if (error) throw error;
  return data;
}

export { getProductsServer as getProducts };

export async function getRelatedProducts(productId: string) {
  const supabase = await createClient();
  
  // 1. Get the relation IDs
  const { data: relations, error: relationError } = await supabase
    .from("product_relations")
    .select("target_product_id")
    .eq("source_product_id", productId);

  if (relationError) throw relationError;

  if (!relations || relations.length === 0) return [];

  const targetIds = relations.map((r: any) => r.target_product_id);

  // 2. Fetch the actual bundles
  const { data: bundles, error: bundlesError } = await supabase
    .from("bundles")
    .select("*")
    .in("id", targetIds);

  if (bundlesError) throw bundlesError;

  return bundles;
}

export async function linkProducts(sourceId: string, targetId: string, type: string = 'related') {
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_relations")
    .insert({
      source_product_id: sourceId,
      target_product_id: targetId,
      relation_type: type
    });

  if (error) throw error;
  return true;
}

export async function getBundles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bundles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}
