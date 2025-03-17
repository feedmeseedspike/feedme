import { products } from "src/lib/data";

export function getAllCategories() {
  return Array.from(
    new Set(
      products.flatMap((product) =>
        Array.isArray(product.category) ? product.category : [product.category]
      )
    )
  );
}


export function getProductsForCard({ tag, limit = 4 }: { tag: string; limit?: number }) {
  return products
    .filter((product) => product.tags.includes(tag) && product.isPublished)
    .slice(0, limit)
    .map(({ name, slug, images }) => ({
      name,
      href: `/product/${slug}`,
      image: images[0],
    }));
}

export function getProductsByTag({ tag, limit = 10 }: { tag: string; limit?: number }) {
  return products.filter((product) => product.tags.includes(tag) && product.isPublished).slice(0, limit);
}

export function getProductBySlug(slug: string) {
  const product = products.find((p) => p.slug === slug )|| null;
  if (!product) throw new Error('Product not found');
  return product;
}
export function getRelatedProductsByCategory({
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
  const filteredProducts = products
    .filter((product) => product.category === category && product.slug !== productId && product.isPublished)
    .sort((a, b) => b.numSales - a.numSales);

  const start = (page - 1) * limit;
  const paginatedProducts = filteredProducts.slice(start, start + limit);

  return {
    data: paginatedProducts,
    totalPages: Math.ceil(filteredProducts.length / limit),
  };
}

export function getAllProducts({
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
  let filteredProducts = products.filter((product) => product.isPublished);

  if (query && query !== 'all') {
    filteredProducts = filteredProducts.filter((product) =>
      product.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  if (category && category !== 'all') {
    filteredProducts = filteredProducts.filter(
      (product) => product.category[0] === category
    );
  }

  if (tag && tag !== 'all') {
    filteredProducts = filteredProducts.filter((product) =>
      product.tags.includes(tag)
    );
  }

  if (rating && rating !== 'all') {
    filteredProducts = filteredProducts.filter(
      (product) => product.avgRating >= Number(rating)
    );
  }

  if (price && price !== 'all') {
    const [minPrice, maxPrice] = price.split('-').map(Number);
    filteredProducts = filteredProducts.filter(
      (product) => product.price >= minPrice && product.price <= maxPrice
    );
  }

  const sortingOptions: Record<string, (a: any, b: any) => number> = {
    'best-selling': (a, b) => b.numSales - a.numSales,
    'price-low-to-high': (a, b) => a.price - b.price,
    'price-high-to-low': (a, b) => b.price - a.price,
    'avg-customer-review': (a, b) => b.avgRating - a.avgRating,
  };

  if (sort && sortingOptions[sort]) {
    filteredProducts.sort(sortingOptions[sort]);
  } else {
    filteredProducts.sort((a: any, b: any) => a._id - b._id);
  }

  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / limit);
  const start = (page - 1) * limit;
  const paginatedProducts = filteredProducts.slice(start, start + limit);

  return {
    products: paginatedProducts,
    totalPages,
    totalProducts,
    from: start + 1,
    to: start + paginatedProducts.length,
  };
}


export function getAllTags() {
  return Array.from(
    new Set(products.flatMap((product) => product.tags))
  ).sort((a, b) => a.localeCompare(b))
  .map((tag) =>
    tag
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );
}
