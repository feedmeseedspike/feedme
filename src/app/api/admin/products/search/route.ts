import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@utils/supabase/server";
import { toSlug } from "src/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    // If no query, return recent/popular products
    if (!query) {
      const supabase = createServiceRoleClient();
      
      const [productsResult, bundlesResult, offersResult] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, slug, images, price, is_published')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(4),
        
        supabase
          .from('bundles')
          .select('id, name, thumbnail_url, price, published_status')
          .eq('published_status', 'published')
          .order('created_at', { ascending: false })
          .limit(2),
          
        supabase
          .from('offers')
          .select('id, title, image_url, price_per_slot, status')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(2)
      ]);

      const results: Array<{
        id: string;
        name: string;
        slug: string;
        type: 'product' | 'bundle' | 'offer';
        image: string | null;
        price?: number;
        description?: string;
      }> = [];

      // Add recent products
      if (productsResult.data) {
        productsResult.data.forEach(product => {
          results.push({
            id: product.id,
            name: product.name,
            slug: product.slug,
            type: 'product',
            image: product.images?.[0] || null,
            price: product.price,
            description: `Product - ₦${product.price?.toLocaleString()}`
          });
        });
      }

      // Add recent bundles  
      if (bundlesResult.data) {
        bundlesResult.data.forEach(bundle => {
          results.push({
            id: bundle.id,
            name: bundle.name,
            slug: toSlug(bundle.name),
            type: 'bundle',
            image: bundle.thumbnail_url,
            price: bundle.price,
            description: `Bundle - ₦${bundle.price?.toLocaleString()}`
          });
        });
      }

      // Add recent offers
      if (offersResult.data) {
        offersResult.data.forEach(offer => {
          results.push({
            id: offer.id,
            name: offer.title,
            slug: toSlug(offer.title),
            type: 'offer',
            image: offer.image_url,
            description: `Offer - ₦${offer.price_per_slot?.toLocaleString()}/slot`
          });
        });
      }

      return NextResponse.json({ 
        results,
        success: true 
      });
    }
    
    if (query.length < 2) {
      return NextResponse.json({ results: [], success: true });
    }

    const supabase = createServiceRoleClient();

    // Search products, bundles, and offers
    const [productsResult, bundlesResult, offersResult] = await Promise.all([
      supabase
        .from('products')
        .select('id, name, slug, images, price, is_published')
        .eq('is_published', true)
        .ilike('name', `%${query}%`)
        .limit(limit),
      
      supabase
        .from('bundles')
        .select('id, name, thumbnail_url, price, published_status')
        .eq('published_status', 'published')
        .ilike('name', `%${query}%`)
        .limit(limit),
        
      supabase
        .from('offers')
        .select('id, title, image_url, price_per_slot, status')
        .eq('status', 'active')
        .ilike('title', `%${query}%`)
        .limit(limit)
    ]);

    const results: Array<{
      id: string;
      name: string;
      slug: string;
      type: 'product' | 'bundle' | 'offer';
      image: string | null;
      price?: number;
      description?: string;
    }> = [];

    // Add products
    if (productsResult.data) {
      productsResult.data.forEach(product => {
        results.push({
          id: product.id,
          name: product.name,
          slug: product.slug,
          type: 'product',
          image: product.images?.[0] || null,
          price: product.price,
          description: `Product - ₦${product.price?.toLocaleString()}`
        });
      });
    }

    // Add bundles  
    if (bundlesResult.data) {
      bundlesResult.data.forEach(bundle => {
        results.push({
          id: bundle.id,
          name: bundle.name,
          slug: toSlug(bundle.name),
          type: 'bundle',
          image: bundle.thumbnail_url,
          price: bundle.price,
          description: `Bundle - ₦${bundle.price?.toLocaleString()}`
        });
      });
    }

    // Add offers
    if (offersResult.data) {
      offersResult.data.forEach(offer => {
        results.push({
          id: offer.id,
          name: offer.title,
          slug: toSlug(offer.title),
          type: 'offer',
          image: offer.image_url,
          description: `Offer - ₦${offer.price_per_slot?.toLocaleString()}/slot`
        });
      });
    }

    // Sort by relevance (exact matches first, then alphabetical)
    results.sort((a, b) => {
      const aExact = a.name.toLowerCase() === query.toLowerCase();
      const bExact = b.name.toLowerCase() === query.toLowerCase();
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ 
      results: results.slice(0, limit),
      success: true 
    });

  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json({ 
      results: [], 
      success: false, 
      error: "Failed to search products" 
    });
  }
}