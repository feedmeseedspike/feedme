import { NextResponse } from "next/server";
import { createClient } from "@utils/supabase/server";
import { toSlug } from "src/lib/utils";

export async function POST(req: Request) {
  try {
    const { slugs } = await req.json();
    
    if (!slugs || !Array.isArray(slugs) || slugs.length === 0) {
      return NextResponse.json({ matches: [], success: true });
    }

    const supabase = await createClient();

    const matches: Array<{
      name: string;
      slug: string;
      type: 'product' | 'bundle' | 'offer';
      url: string;
    }> = [];

    // Check each slug in products, bundles, and offers
    for (const slug of slugs) {
      // Check products
      const { data: product } = await supabase
        .from('products')
        .select('id, name, slug')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (product) {
        matches.push({
          name: product.name,
          slug: product.slug,
          type: 'product',
          url: `/products/${product.slug}`
        });
        continue;
      }

      // Check bundles (by generating slug from name)
      const { data: bundles } = await supabase
        .from('bundles')
        .select('id, name, published_status')
        .eq('published_status', 'published');

      const matchingBundle = bundles?.find(bundle => toSlug(bundle.name) === slug);
      
      if (matchingBundle) {
        matches.push({
          name: matchingBundle.name,
          slug: toSlug(matchingBundle.name),
          type: 'bundle',
          url: `/bundles/${toSlug(matchingBundle.name)}`
        });
        continue;
      }

      // Check offers (by generating slug from title)
      const { data: offers } = await supabase
        .from('offers')
        .select('id, title, status')
        .eq('status', 'active');

      const matchingOffer = offers?.find(offer => toSlug(offer.title) === slug);
      
      if (matchingOffer) {
        matches.push({
          name: matchingOffer.title,
          slug: toSlug(matchingOffer.title),
          type: 'offer',
          url: `/offers/${toSlug(matchingOffer.title)}`
        });
      }
    }

    return NextResponse.json({ 
      matches,
      success: true 
    });

  } catch (error) {
    console.error("Error finding product matches:", error);
    return NextResponse.json({ 
      matches: [], 
      success: false, 
      error: "Failed to find product matches" 
    });
  }
}