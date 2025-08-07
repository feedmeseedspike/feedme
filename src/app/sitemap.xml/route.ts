import { createClient } from "@utils/supabase/server";
import { toSlug } from "src/lib/utils";

export async function GET() {
  const baseUrl = 'https://shopfeedme.com';
  const supabase = await createClient();

  try {
    // Static pages
    const staticPages = [
      '',
      '/bundles',
      '/search',
      '/customer-support',
      '/cart',
      '/checkout',
    ];

    // Get products
    const { data: products } = await supabase
      .from('products')
      .select('slug, name, updated_at')
      .eq('is_published', true);

    // Get bundles
    const { data: bundles } = await supabase
      .from('bundles')
      .select('name, updated_at')
      .eq('published_status', 'published');

    // Get categories
    const { data: categories } = await supabase
      .from('categories')
      .select('title, updated_at');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('')}
  
  ${products?.map(product => `
  <url>
    <loc>${baseUrl}/product/${product.slug}</loc>
    <lastmod>${product.updated_at || new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join('') || ''}
  
  ${bundles?.map(bundle => `
  <url>
    <loc>${baseUrl}/bundles/${toSlug(bundle.name)}</loc>
    <lastmod>${bundle.updated_at || new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('') || ''}
  
  ${categories?.map(category => `
  <url>
    <loc>${baseUrl}/category/${toSlug(category.title)}</loc>
    <lastmod>${category.updated_at || new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`).join('') || ''}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}