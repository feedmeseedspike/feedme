import { MetadataRoute } from 'next'
import { createServerComponentClient } from 'src/utils/supabase/server'
import { toSlug } from 'src/lib/utils'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://shopfeedme.com'
  const supabase = await createServerComponentClient()

  // Fetch products
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_published', true)

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('title')

  // Fetch bundles
  const { data: bundles } = await supabase
    .from('bundles')
    .select('name, updated_at')
    .eq('published_status', 'published')

  const productEntries: MetadataRoute.Sitemap = (products || []).map((p) => ({
    url: `${baseUrl}/product/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  const categoryEntries: MetadataRoute.Sitemap = (categories || []).map((c) => ({
    url: `${baseUrl}/category/${toSlug(c.title)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const bundleEntries: MetadataRoute.Sitemap = (bundles || []).map((b) => ({
    url: `${baseUrl}/bundles/${toSlug(b.name || '')}`,
    lastModified: b.updated_at ? new Date(b.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const staticPages: MetadataRoute.Sitemap = [
    '',
    '/bundles',
    '/customer-support',
    '/faq',
    '/privacy-policy',
    '/return-policy',
    '/delivery-policy',
    '/careers',
    '/blog',
    '/offers',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: route === '' ? 1 : 0.5,
  }))

  return [...staticPages, ...productEntries, ...categoryEntries, ...bundleEntries]
}
