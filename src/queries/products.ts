import { TypedSupabaseClient } from '../utils/types'

export async function getAllProducts(client: TypedSupabaseClient, {
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
  let queryBuilder = client
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

  const { data, error } = await queryBuilder.range((page - 1) * limit, page * limit - 1);
  if (error) throw error;

  return {
    products: data,
    totalPages: Math.ceil(data.length / limit),
    totalProducts: data.length,
    from: (page - 1) * limit + 1,
    to: (page - 1) * limit + data.length,
  };
}

// Query function for getting products by tag
export function getProductsByTagQuery(client: TypedSupabaseClient, tag: string, limit?: number) {
  let query = client
    .from('products')
    .select('*')
    .contains('tags', [tag]);

  if (limit) {
    query = query.limit(limit);
  }

  return query;
}