import { getProducts, getCategories } from '../api';
import { createClient } from '../../utils/supabase/client';

const supabase = createClient();

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
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .contains('tags', ['trending'])
    .eq('is_published', true)
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getFreshFruits({ limit = 10 }: { limit?: number }) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .contains('tags', ['fresh-fruits'])
    .eq('is_published', true)
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getFreshVegetables({ limit = 10 }: { limit?: number }) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .contains('tags', ['fresh-vegetables'])
    .eq('is_published', true)
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getProductsByTag({ tag, limit = 10 }: { tag: string; limit?: number }) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .contains('tags', [tag])
    .eq('is_published', true)
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) throw error;
  return data;
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
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .contains('category_ids', [category])
    .neq('id', productId)
    .eq('is_published', true)
    .order('num_sales', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  if (error) throw error;
  return {
    data,
    totalPages: Math.ceil(data.length / limit),
  };
}

export async function getAllProducts({
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
  console.log("getAllProducts parameters:", { query, limit, page, category, tag, price, rating, sort });
  let queryBuilder = supabase
    .from('products')
    .select('*')
    .eq('is_published', true);

  if (query && query !== 'all') {
    queryBuilder = queryBuilder.ilike('name', `%${query}%`);
  }

  if (category && category !== 'all') {
    queryBuilder = queryBuilder.contains('category_ids', [category]);
  }

  if (tag && tag !== 'all') {
    queryBuilder = queryBuilder.contains('tags', [tag]);
  }

  if (rating && rating !== 'all') {
    queryBuilder = queryBuilder.gte('avg_rating', Number(rating));
  }

  if (price && price !== 'all') {
    const [minPrice, maxPrice] = price.split('-').map(Number);
    queryBuilder = queryBuilder.gte('price', minPrice).lte('price', maxPrice);
  }

  const sortingOptions: Record<string, { column: string; ascending: boolean }> = {
    'best-selling': { column: 'num_sales', ascending: false },
    'price-low-to-high': { column: 'price', ascending: true },
    'price-high-to-low': { column: 'price', ascending: false },
    'avg-customer-review': { column: 'avg_rating', ascending: false },
  };

  if (sort && sortingOptions[sort]) {
    queryBuilder = queryBuilder.order(sortingOptions[sort].column, { ascending: sortingOptions[sort].ascending });
  } else {
    queryBuilder = queryBuilder.order('id', { ascending: true });
  }

  console.log("getAllProducts queryBuilder before execution:");
  // Note: Logging the full queryBuilder object might be too verbose, 
  // but this will at least show the state of chaining.
  // For detailed query inspection, you might need to use Supabase client debug features if available or log constructed URL/params if the client allows.

  const { data, error } = await queryBuilder.range((page - 1) * limit, page * limit - 1);
  if (error) {
    console.error("Error executing getAllProducts query:", error);
    throw error; // Re-throw the error after logging
  }

  return {
    products: data,
    totalPages: Math.ceil(data.length / limit),
    totalProducts: data.length,
    from: (page - 1) * limit + 1,
    to: (page - 1) * limit + data.length,
  };
}

export async function getAllTags() {
  const allProducts = await getProducts();
  return Array.from(
    new Set(allProducts.flatMap((product) => product.tags || []))
  )
    .sort((a, b) => a.localeCompare(b))
    .map((tag) =>
      tag
        .split('-')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    );
}
