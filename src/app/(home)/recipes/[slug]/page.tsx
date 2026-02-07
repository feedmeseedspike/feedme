export const dynamic = "force-dynamic";

import { fetchBundleBySlugWithProducts } from "src/queries/bundles";
import RecipeClient from "./RecipeClient";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { createClient } from "@utils/supabase/server";

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const supabase = await createClient();
    const bundle = await fetchBundleBySlugWithProducts(params.slug, supabase);
    
    if (!bundle) {
      return {
        title: "Recipe Not Found | FeedMe",
      };
    }

    return {
      title: `${bundle.name} | Cook it with FeedMe`,
      description: bundle.description || `Get all the ingredients for ${bundle.name} delivered in minutes.`,
      openGraph: {
        images: bundle.social_image_url || bundle.thumbnail_url || [],
        title: bundle.name,
        description: `Cook like a pro! Get the full ingredient bundle for ${bundle.name}.`,
      },
      twitter: {
        card: "summary_large_image",
        title: bundle.name,
        description: `Cook like a pro! Get the full ingredient bundle for ${bundle.name}.`,
        images: bundle.social_image_url || bundle.thumbnail_url || [],
      }
    };
  } catch (error) {
    return {
      title: "Recipe | FeedMe",
    };
  }
}

export default async function RecipePage({ params }: PageProps) {
  try {
    const supabase = await createClient();
    const bundle = await fetchBundleBySlugWithProducts(params.slug, supabase);
    
    // Pass everything to the client component for the interactive experience
    return <RecipeClient bundle={bundle} />;
  } catch (error) {
    console.error("Error fetching recipe:", error);
    notFound();
  }
}
