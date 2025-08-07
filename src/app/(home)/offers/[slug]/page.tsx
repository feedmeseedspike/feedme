import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { toSlug } from "src/lib/utils";
import OfferDetailClient from './OfferDetailClient';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const supabase = await createClient();
    
    // Get all offers and find the one that matches the slug
    const { data: allOffers } = await supabase
      .from('offers')
      .select('*');

    const matchingOffer = allOffers?.find(offer => {
      if (!offer.title) return false;
      const offerSlug = toSlug(offer.title);
      return offerSlug === params.slug;
    });
    
    if (matchingOffer) {
      return {
        title: `${matchingOffer.title} | FeedMe Offers`,
        description: matchingOffer.description || `Get ${matchingOffer.title} for ₦${matchingOffer.price_per_slot} per slot`,
        alternates: {
          canonical: `https://shopfeedme.com/offers/${params.slug}`,
        },
        openGraph: {
          title: matchingOffer.title,
          description: matchingOffer.description,
          images: matchingOffer.image_url ? [{ url: matchingOffer.image_url }] : [],
          url: `https://shopfeedme.com/offers/${params.slug}`,
        },
        twitter: {
          card: "summary_large_image",
          title: matchingOffer.title,
          description: matchingOffer.description || "",
          images: [matchingOffer.image_url || "/opengraph-image.jpg"],
        },
      };
    }
  } catch (error) {
    console.error("Error fetching offer metadata:", error);
  }

  return {
    title: 'Offer Not Found | FeedMe',
    description: "The offer you are looking for does not exist.",
    alternates: {
      canonical: `https://shopfeedme.com/offers/${params.slug}`,
    },
    openGraph: {
      title: "Offer Not Found",
      description: "The offer you are looking for does not exist.",
      images: "/logo.png",
    },
  };
}

export default async function OfferDetailPage({ params }: Props) {
  try {
    const supabase = await createClient();
    
    // Get all offers and find the one that matches the slug
    // Try authenticated access first, then fall back to public access
    const { data: allOffers, error: fetchError } = await supabase
      .from('offers')
      .select('*');

    if (fetchError) {
      throw fetchError;
    }

    // Find the offer whose title, when converted to slug, matches the provided slug
    const matchingOffer = allOffers?.find(offer => {
      if (!offer.title) return false;
      const offerSlug = toSlug(offer.title);
      return offerSlug === params.slug;
    });

    if (!matchingOffer) {
      return notFound();
    }

    return <OfferDetailClient offerId={matchingOffer.id} />;
  } catch (error) {
    console.error("Error fetching offer details:", error);
    return notFound();
  }
}
