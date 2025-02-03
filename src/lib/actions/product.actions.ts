import { products } from "src/lib/data";

export function getAllCategories() {
  return Array.from(new Set(products.map((product) => product.category)));
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
  const product = products.find((p) => p.slug === slug && p.isPublished);
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
