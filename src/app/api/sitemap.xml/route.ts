import { NextResponse } from 'next/server';
import { createClient } from '../../../utils/supabase/server';
import { getAllProducts } from '../../../queries/products';
import { getAllCategories } from '../../../queries/products';
import { fetchBundles } from '../../../queries/bundles';

const BASE_URL = 'https://shopfeedme.com';

export async function GET() {
  const client = await createClient();

  // Fetch products
  const { products } = await getAllProducts(client, { limit: 1000, page: 1 });
  // Fetch categories
  const categories = await getAllCategories();
  // Fetch bundles
  const { data: bundles } = await fetchBundles({ itemsPerPage: 1000, page: 1 });

  let urls = [
    '', // Home
    '/login',
    '/register',
    '/contact',
    '/search',
    '/cart',
    '/checkout',
    '/recommended',
    '/return-policy',
    '/community',
    '/customer-support',
    '/careers',
    '/browsing-history',
  ];

  // Add product pages
  if (products) {
    urls = urls.concat(products.map((p: any) => `/product/${p.slug}`));
  }
  // Add category pages
  if (categories) {
    urls = urls.concat(categories.map((c: any) => `/category/${c.slug || c.id}`));
  }
  // Add bundle pages
  if (bundles) {
    urls = urls.concat(bundles.map((b: any) => `/bundles/${b.id}`));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
    .map(
      (url) => `  <url>\n    <loc>${BASE_URL}${url}</loc>\n    <priority>${url === '' ? '1.0' : '0.7'}</priority>\n  </url>`
    )
    .join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  });
} 