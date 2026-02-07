"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Play, Star, X, Quote, Image as ImageIcon } from "lucide-react";
import { createClient } from "@utils/supabase/client";
import type { Tables } from "@utils/database.types";
import { formatNaira, toSlug } from "src/lib/utils";
import {
  Carousel,
  Slider,
  SliderContainer,
  SliderDotButton,
  SliderNextButton,
  SliderPrevButton,
} from "@components/ui/review-carousel";
import { useMediaQuery } from "usehooks-ts";

interface Review {
  id: string;
  customerName: string;
  rating: number;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  verified: boolean;
  date?: string;
  linkPreferences?: {
    type: "product" | "bundle" | "offer";
    slot?: number;
    identifier?: string; // slug for product, name for bundle, title for offer
  }[];
  fallbackRelatedItems?: {
    name: string;
    href: string;
    type: "product" | "bundle" | "offer";
    image?: string;
  }[];
}

type ProductRow = Tables<"products">;
type BundleRow = Tables<"bundles">;
type OfferRow = Tables<"offers">;

type ResolvedLinkedItem = {
  type: "product" | "bundle" | "offer";
  name: string;
  href: string;
  image?: string | null;
  price?: number | null;
  isFallback?: boolean;
};

interface CustomerReviewsProps {
  reviews?: Review[];
}

const getYouTubeId = (url: string) => {
    if (!url) return null;
    if(url.includes("/shorts/")) {
        const parts = url.split("/shorts/");
        return parts[1].split("?")[0];
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const isYouTubeUrl = (url: string) => {
    return url.includes("youtube.com") || url.includes("youtu.be");
};


const defaultReviews: Review[] = [
  {
    id: "1",
    customerName: "Aisha Balogun",
    rating: 5,
    description:
      "Absolutely love the fresh produce! The quality is amazing and delivery was super fast. Highly recommend!",
    videoUrl: "https://youtube.com/shorts/-gGo7JhBMhg?si=G7p7jYa4hxP6Tm9e",

    verified: true,
    date: "2025-11-22",
    linkPreferences: [
      { type: "product", slot: 0 },
      { type: "bundle", slot: 0 }
    ],
    fallbackRelatedItems: [
      {
        name: "Fresh Vegetables Bundle",
        href: "/bundles/fresh-vegetables",
        type: "bundle",
        image: "/images/review-thumb-1.jpg",
      },
      {
        name: "Tomatoes",
        href: "/product/tomato-jos",
        type: "product",
        image: "/images/tomatoes.jpeg", // Hypothetical
      }
    ],
  },
  {
    id: "2",
    customerName: "Adigun Zainab",
    rating: 5,
    description:
      "Best grocery delivery service I've used. Everything arrived fresh and on time. Will definitely order again!",
    videoUrl: "https://youtube.com/shorts/fZi6tWt9RM4?si=e6dmvvomx1XQ9KxP",

    verified: true,
    date: "2025-11-15",
    linkPreferences: [
      { type: "product", identifier: "spring-onion" }
    ],
    fallbackRelatedItems: [
      {
        name: "Spring Onion",
        href: "/product/spring-onion",
        type: "product",
      },
    ],
  },
  {
    id: "3",
    customerName: "Amina Okafor",
    rating: 5,
    description:
      "The quality exceeded my expectations. Fresh, organic, and delivered right to my doorstep. Amazing service!",
    videoUrl: "https://youtube.com/shorts/RJk8eY-Q6eU?si=ZEmdqM6ErgEudNJI",

    verified: true,
    date: "2025-11-19",
    linkPreferences: [
      { type: "product", slot: 1 },
      { type: "product", slot: 2 },
      { type: "bundle", slot: 1 }
    ],
    fallbackRelatedItems: [
      {
        name: "Organic Produce Box",
        href: "/products/organic-produce-box",
        type: "product",
        image: "/images/review-thumb-3.jpg",
      },
    ],
  },
  {
    id: "4",
    customerName: "Blessing Okonkwo",
    rating: 5,
    description:
      "Fast delivery and excellent customer service. The tomatoes were so fresh, tasted like they were just picked!",
    videoUrl: "https://youtube.com/shorts/-gGo7JhBMhg?si=G7p7jYa4hxP6Tm9e",

    verified: true,
    date: "2025-11-10",
    linkPreferences: [
      { type: "bundle", slot: 0 }
    ],
    fallbackRelatedItems: [
      {
        name: "Seasonal Fruits Pack",
        href: "/bundles/seasonal-fruits",
        type: "bundle",
        image: "/images/review-thumb-4.jpg",
      },
    ],
  },
  // Duplicates for seamless looping
  {
    id: "1-dup",
    customerName: "Sarah Johnson",
    rating: 5,
    description:
      "Absolutely love the fresh produce! The quality is amazing and delivery was super fast. Highly recommend!",
    videoUrl: "https://youtube.com/shorts/-gGo7JhBMhg?si=G7p7jYa4hxP6Tm9e",

    verified: true,
    date: "2025-11-22",
    linkPreferences: [
      { type: "product", slot: 0 },
      { type: "bundle", slot: 0 }
    ],
    fallbackRelatedItems: [
      {
        name: "Fresh Vegetables Bundle",
        href: "/bundles/fresh-vegetables",
        type: "bundle",
        image: "/images/review-thumb-1.jpg",
      },
    ],
  },
  {
    id: "2-dup",
    customerName: "Adigun Zainab",
    rating: 5,
    description:
      "Best grocery delivery service I've used. Everything arrived fresh and on time. Will definitely order again!",
    videoUrl: "https://youtube.com/shorts/fZi6tWt9RM4?si=e6dmvvomx1XQ9KxP",

    verified: true,
    date: "2025-11-15",
    linkPreferences: [
      { type: "offer", slot: 0 }
    ],
    fallbackRelatedItems: [
      {
        name: "Premium Fruits Collection",
        href: "/offers/premium-fruits",
        type: "offer",
        image: "/images/review-thumb-2.jpg",
      },
    ],
  },
  {
    id: "3-dup",
    customerName: "Amina Okafor",
    rating: 5,
    description:
      "The quality exceeded my expectations. Fresh, organic, and delivered right to my doorstep. Amazing service!",
    videoUrl: "https://youtube.com/shorts/RJk8eY-Q6eU?si=ZEmdqM6ErgEudNJI",

    verified: true,
    date: "2025-11-19",
    linkPreferences: [
      { type: "product", slot: 1 },
      { type: "product", slot: 2 },
      { type: "bundle", slot: 1 }
    ],
    fallbackRelatedItems: [
      {
        name: "Organic Produce Box",
        href: "/products/organic-produce-box",
        type: "product",
        image: "/images/review-thumb-3.jpg",
      },
    ],
  },
  {
    id: "4-dup",
    customerName: "Blessing Okonkwo",
    rating: 5,
    description:
      "Fast delivery and excellent customer service. The tomatoes were so fresh, tasted like they were just picked!",
    videoUrl: "https://youtube.com/shorts/-gGo7JhBMhg?si=G7p7jYa4hxP6Tm9e",

    verified: true,
    date: "2025-11-10",
    linkPreferences: [
      { type: "bundle", slot: 0 }
    ],
    fallbackRelatedItems: [
      {
        name: "Seasonal Fruits Pack",
        href: "/bundles/seasonal-fruits",
        type: "bundle",
        image: "/images/review-thumb-4.jpg",
      },
    ],
  },
  // Second set of duplicates for extra buffer
  {
    id: "1-dup-2",
    customerName: "Aisha Balogun",
    rating: 5,
    description:
      "Absolutely love the fresh produce! The quality is amazing and delivery was super fast. Highly recommend!",
    videoUrl: "https://youtube.com/shorts/-gGo7JhBMhg?si=G7p7jYa4hxP6Tm9e",

    verified: true,
    date: "2025-11-22",
    linkPreferences: [
      { type: "product", slot: 0 },
      { type: "bundle", slot: 0 }
    ],
    fallbackRelatedItems: [
      {
        name: "Fresh Vegetables Bundle",
        href: "/bundles/fresh-vegetables",
        type: "bundle",
        image: "/images/review-thumb-1.jpg",
      },
    ],
  },
  {
    id: "2-dup-2",
    customerName: "Adigun Zainab",
    rating: 5,
    description:
      "Best grocery delivery service I've used. Everything arrived fresh and on time. Will definitely order again!",
    videoUrl: "https://youtube.com/shorts/fZi6tWt9RM4?si=e6dmvvomx1XQ9KxP",

    verified: true,
    date: "2025-11-15",
    linkPreferences: [
      { type: "offer", slot: 0 }
    ],
    fallbackRelatedItems: [
      {
        name: "Premium Fruits Collection",
        href: "/offers/premium-fruits",
        type: "offer",
        image: "/images/review-thumb-2.jpg",
      },
    ],
  },
  {
    id: "3-dup-2",
    customerName: "Amina Okafor",
    rating: 5,
    description:
      "The quality exceeded my expectations. Fresh, organic, and delivered right to my doorstep. Amazing service!",
    videoUrl: "https://youtube.com/shorts/RJk8eY-Q6eU?si=ZEmdqM6ErgEudNJI",

    verified: true,
    date: "2025-11-19",
    linkPreferences: [
      { type: "product", slot: 1 },
      { type: "product", slot: 2 },
      { type: "bundle", slot: 1 }
    ],
    fallbackRelatedItems: [
      {
        name: "Organic Produce Box",
        href: "/products/organic-produce-box",
        type: "product",
        image: "/images/review-thumb-3.jpg",
      },
    ],
  },
  {
    id: "4-dup-2",
    customerName: "Blessing Okonkwo",
    rating: 5,
    description:
      "Fast delivery and excellent customer service. The tomatoes were so fresh, tasted like they were just picked!",
    videoUrl: "https://youtube.com/shorts/-gGo7JhBMhg?si=G7p7jYa4hxP6Tm9e",

    verified: true,
    date: "2025-11-10",
    linkPreferences: [
      { type: "bundle", slot: 0 }
    ],
    fallbackRelatedItems: [
      {
        name: "Seasonal Fruits Pack",
        href: "/bundles/seasonal-fruits",
        type: "bundle",
        image: "/images/review-thumb-4.jpg",
      },
    ],
  },
];

export default function CustomerReviews({
  reviews = defaultReviews,
}: CustomerReviewsProps) {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [selectedLinkedItems, setSelectedLinkedItems] =
    useState<ResolvedLinkedItem[]>([]);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [generatedThumbnails, setGeneratedThumbnails] = useState<
    Record<string, string>
  >({});
  const [linkedCollections, setLinkedCollections] = useState<{
    products: ProductRow[];
    bundles: BundleRow[];
    offers: OfferRow[];
  }>({
    products: [],
    bundles: [],
    offers: [],
  });
  const isTablet = useMediaQuery("(min-width: 768px)");
  const isDesktop = useMediaQuery("(min-width: 1280px)");

  const slidesPerView = useMemo(() => {
    if (isDesktop) return 3.5;
    if (isTablet) return 2.5;
    return 1.2;
  }, [isDesktop, isTablet]);

  const slideWidth = useMemo(() => {
    if (isDesktop) {
      return "calc(28% - 16px)";
    }
    if (isTablet) {
      return "calc(40% - 16px)";
    }
    return "calc(80vw - 16px)";
  }, [isDesktop, isTablet]);

  const carouselOpts = useMemo(
    () => ({
      loop: true,
      align: "center" as const,
      skipSnaps: false,
    }),
    []
  );

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();
    
    // Extract required identifiers from reviews
    const neededProducts = new Set<string>();
    const neededBundles = new Set<string>();
    const neededOffers = new Set<string>();

    reviews.forEach(review => {
        review.linkPreferences?.forEach(pref => {
            if (pref.identifier) {
                if (pref.type === "product") neededProducts.add(pref.identifier);
                if (pref.type === "bundle") neededBundles.add(pref.identifier);
                if (pref.type === "offer") neededOffers.add(pref.identifier);
            }
        });
    });

    const fetchLinkedEntities = async () => {
      try {
        // Prepare queries
        const productQuery = supabase
            .from("products")
            .select("id,name,slug,images,price,is_published,num_sales")
            .eq("is_published", true);

        const bundleQuery = supabase
            .from("bundles")
            .select("id,name,price,thumbnail_url,published_status,stock_status,created_at")
            .eq("published_status", "published");

        const offerQuery = supabase
            .from("offers")
            .select("id,title,image_url,price_per_slot,status,created_at");

        // Execute parallel requests for Top Items AND Specific Items
        const [
            topProducts, 
            specificProducts,
            topBundles, 
            specificBundles, 
            topOffers,
            specificOffers
        ] = await Promise.all([
            // Top 8 Products
            productQuery.range(0, 7).order("num_sales", { ascending: false }),
            // Specific Products (if any)
            neededProducts.size > 0 
                ? supabase.from("products").select("id,name,slug,images,price,is_published").in("slug", Array.from(neededProducts))
                : Promise.resolve({ data: [] }),
            
            // Top 6 Bundles
            bundleQuery.range(0, 5).order("created_at", { ascending: false }),
            // Specific Bundles
            neededBundles.size > 0
                ? supabase.from("bundles").select("id,name,price,thumbnail_url,published_status,stock_status").in("name", Array.from(neededBundles))
                : Promise.resolve({ data: [] }),

            // Top 6 Offers
            offerQuery.range(0, 5).order("created_at", { ascending: false }),
            // Specific Offers
            neededOffers.size > 0
                ? supabase.from("offers").select("id,title,image_url,price_per_slot,status").in("title", Array.from(neededOffers))
                : Promise.resolve({ data: [] }),
        ]);

        if (!isMounted) return;

        // Merge and Deduplicate
        const merge = <T extends { id: string }>(arr1: T[] | null, arr2: T[] | null) => {
            const map = new Map<string, T>();
            arr1?.forEach(i => map.set(i.id, i));
            arr2?.forEach(i => map.set(i.id, i));
            return Array.from(map.values());
        };

        setLinkedCollections({
          products: merge(topProducts.data, specificProducts.data) as ProductRow[],
          bundles: merge(topBundles.data, specificBundles.data) as BundleRow[],
          offers: merge(topOffers.data, specificOffers.data) as OfferRow[],
        });
      } catch (error) {
        console.error("Failed to load showcase links for reviews", error);
      }
    };

    fetchLinkedEntities();

    return () => {
      isMounted = false;
    };
  }, [reviews]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${
          i < rating
            ? "fill-[#F2C94C] text-[#F2C94C]"
            : "fill-white/30 text-white/30"
        }`}
      />
    ));
  };

  const resolveLinkedItems = useCallback(
    (review: Review): ResolvedLinkedItem[] => {
      const pickFromList = <T,>(list: T[], slot = 0): T | null => {
        if (!list || list.length === 0) return null;
        const normalizedSlot =
          ((slot % list.length) + list.length) % list.length;
        return list[normalizedSlot];
      };

      const resolvedItems: ResolvedLinkedItem[] = [];

      if (review.linkPreferences) {
        review.linkPreferences.forEach(({ type, slot, identifier }) => {
          if (type === "product") {
            let product;
            if (identifier) {
                product = linkedCollections.products.find(p => p.slug === identifier);
            } else if (typeof slot === 'number') {
                product = pickFromList(linkedCollections.products, slot);
            }
            
            if (product) {
              resolvedItems.push({
                type,
                name: product.name,
                href: `/product/${product.slug}`,
                image: Array.isArray(product.images)
                  ? ((product.images[0] as string | undefined) ?? null)
                  : null,
                price: product.price,
              });
            }
          }
          if (type === "bundle") {
            let bundle;
            if (identifier) {
                bundle = linkedCollections.bundles.find(b => b.name === identifier);
            } else if (typeof slot === 'number') {
                bundle = pickFromList(linkedCollections.bundles, slot);
            }

            if (bundle) {
              resolvedItems.push({
                type,
                name: bundle.name,
                href: `/bundles/${toSlug(bundle.name)}`,
                image: bundle.thumbnail_url,
                price: bundle.price,
              });
            }
          }
          if (type === "offer") {
            let offer;
            if (identifier) {
                offer = linkedCollections.offers.find(o => o.title === identifier);
            } else if (typeof slot === 'number') {
                offer = pickFromList(linkedCollections.offers, slot);
            }

            if (offer) {
              resolvedItems.push({
                type,
                name: offer.title,
                href: `/offers/${toSlug(offer.title)}`,
                image: offer.image_url,
                price: offer.price_per_slot,
              });
            }
          }
        });
      }

      if (review.fallbackRelatedItems) {
        review.fallbackRelatedItems.forEach((item) => {
            resolvedItems.push({
                type: item.type,
                name: item.name,
                href: item.href,
                image: item.image,
                price: null,
                isFallback: true,
            });
        });
      }

      return resolvedItems;
    },
    [linkedCollections]
  );

  const closeReview = useCallback(() => {
    setSelectedReview(null);
    setShowAllProducts(false);
  }, []);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const formatDate = (value?: string) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return value;
  };

  useEffect(() => {
    const videos: HTMLVideoElement[] = [];
    let cancelled = false;

    reviews.forEach((review) => {
      // Skip if already has thumbnail, is generated, or is a YouTube URL
      if (review.thumbnailUrl || generatedThumbnails[review.id] || isYouTubeUrl(review.videoUrl)) return;

      const video = document.createElement("video");
      video.src = review.videoUrl;
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";

      const handleLoadedData = () => {
        if (cancelled) return cleanup();
        const canvas = document.createElement("canvas");
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 360;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          setGeneratedThumbnails((prev) => {
            if (prev[review.id]) return prev;
            return { ...prev, [review.id]: dataUrl };
          });
        }
        cleanup();
      };

      const handleError = () => cleanup();

      const cleanup = () => {
        video.removeEventListener("loadeddata", handleLoadedData);
        video.removeEventListener("error", handleError);
        video.pause();
        video.removeAttribute("src");
        video.load();
      };

      video.addEventListener("loadeddata", handleLoadedData);
      video.addEventListener("error", handleError);
      videos.push(video);
      video.load();
    });

    return () => {
      cancelled = true;
      videos.forEach((video) => {
        video.pause();
        video.removeAttribute("src");
        video.load();
      });
    };
  }, [reviews, generatedThumbnails]);

  useEffect(() => {
    if (!selectedReview) {
      setSelectedLinkedItems([]);
      return;
    }
    setSelectedLinkedItems(resolveLinkedItems(selectedReview));
  }, [selectedReview, resolveLinkedItems]);

  return (
    <>
      <section className="py-24 bg-[#FAFAF9] relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[#1B6013]/5 rounded-full blur-[120px]" />
            <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-[#F2C94C]/5 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 mb-16 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <span className="text-[#1B6013] font-medium tracking-widest text-sm uppercase mb-3">Community Stories</span>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1D2939] mb-6 tracking-tight font-serif">
              Loved by Locals
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Discover how FeedMe is bringing fresh, organic joy to kitchens across the city. 
              Real stories from our cherished community.
            </p>
          </div>
        </div>

        <div className="w-full relative z-10">
          <Carousel opts={carouselOpts} isScale={true} className="w-full">
            <SliderContainer className="py-10">
              {reviews.map((review, index) => {
                const resolvedLinkedItems = resolveLinkedItems(review);
                // For the card view, just picking the first one as a thumbnail if available
                const firstLinkedItem = resolvedLinkedItems[0];
                return (
                  <Slider
                    key={review.id}
                    slideIndex={index}
                    style={{
                      width: slideWidth,
                      minWidth: slideWidth,
                      maxWidth: slideWidth,
                      flexShrink: 0,
                    }}
                    className="px-3"
                  >
                    <motion.article
                      layoutId={`review-card-${review.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05, duration: 0.4 }}
                      className="relative group/card h-[500px] w-full cursor-pointer rounded-[24px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 ease-out transform hover:-translate-y-2"
                      onClick={() => setSelectedReview(review)}
                    >
                      {/* Video/Image Background */}
                      <div className="absolute inset-0 bg-gray-200">
                        {(() => {
                          // Prioritize showing the video itself as the thumbnail/background
                          // Prioritize showing the video itself as the thumbnail/background
                          if (review.videoUrl) {
                            if (isYouTubeUrl(review.videoUrl)) {
                                const videoId = getYouTubeId(review.videoUrl);
                                const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "";
                                
                                return (
                                  <div className="relative w-full h-full bg-black group-hover/card:scale-105 transition-transform duration-700">
                                    <Image
                                        src={thumbnailUrl || ""}
                                        alt={review.customerName}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover/card:bg-black/10 transition-colors duration-500" />
                                    {/* Play icon overlay for YouTube videos to indicate it's playable */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-70 group-hover/card:opacity-100 transition-opacity">
                                        <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                                            <Play className="w-5 h-5 text-white fill-white" />
                                        </div>
                                    </div>
                                  </div>
                                );
                            }

                            return (
                              <div className="relative w-full h-full bg-black">
                                <video
                                  src={`${review.videoUrl}#t=0.1`}
                                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                                  muted
                                  playsInline
                                  preload="metadata"
                                  loop
                                  onMouseOver={(e) => e.currentTarget.play()}
                                  onMouseOut={(e) => {
                                    e.currentTarget.pause();
                                    e.currentTarget.currentTime = 0.1;
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover/card:bg-black/10 transition-colors duration-500 pointer-events-none" />
                              </div>
                            );
                          }
                          
                          const thumbnailSrc =
                            review.thumbnailUrl ||
                            generatedThumbnails[review.id];
                          const resolvedItems = resolveLinkedItems(review);
                          const firstItem = resolvedItems[0];
                          
                          if (thumbnailSrc) {
                            return (
                              <div className="relative w-full h-full">
                                <Image
                                  src={thumbnailSrc}
                                  alt={review.customerName}
                                  fill
                                  className="object-cover transition-transform duration-700 group-hover/card:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover/card:bg-black/10 transition-colors duration-500" />
                              </div>
                            );
                          }
                          
                          if (firstItem?.image) {
                            return (
                              <div className="relative w-full h-full">
                                <Image
                                  src={firstItem.image}
                                  alt={firstItem.name}
                                  fill
                                  className="object-cover transition-transform duration-700 group-hover/card:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/20" />
                              </div>
                            );
                          }
                          
                          return (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#1B6013] to-[#0D3009] flex items-center justify-center">
                                <span className="text-white/20 text-9xl font-serif italic">“</span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Gradient Overlay for Text */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90 transition-opacity duration-300 pointer-events-none" />

                      {/* Play Button (Centered, appears on hover) */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-500 transform scale-90 group-hover/card:scale-100 pointer-events-none">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg">
                            <Play className="w-6 h-6 text-white fill-white ml-1" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 flex flex-col justify-end h-full pointer-events-none">
                        <div className="transform translate-y-4 group-hover/card:translate-y-0 transition-transform duration-500">
                            {/* Rating */}
                            <div className="flex items-center gap-1 mb-3">
                                {renderStars(review.rating)}
                            </div>

                            {/* Quote */}
                            <div className="relative mb-4">
                                <Quote className="absolute -top-2 -left-2 w-4 h-4 text-white/40 transform -scale-x-100" />
                                <p className="text-white/95 text-lg font-medium leading-relaxed line-clamp-3 pl-4">
                                    {review.description}
                                </p>
                            </div>

                            {/* User Info */}
                            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
                                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white font-semibold text-sm">
                                    {getInitials(review.customerName)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-white font-semibold text-sm tracking-wide">
                                            {review.customerName}
                                        </h4>
                                        {review.verified && (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-[#F2C94C]" />
                                        )}
                                    </div>
                                    {review.date && (
                                        <p className="text-white/60 text-xs mt-0.5">
                                            {formatDate(review.date)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                      </div>
                    </motion.article>
                  </Slider>
                );
              })}
            </SliderContainer>
            
            <div className="flex justify-center gap-4 mt-8">
                <SliderPrevButton className="static transform-none bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-[#1B6013] w-12 h-12 rounded-full shadow-sm transition-all" />
                <SliderNextButton className="static transform-none bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-[#1B6013] w-12 h-12 rounded-full shadow-sm transition-all" />
            </div>
          </Carousel>
        </div>
      </section>

      <AnimatePresence>
        {selectedReview && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeReview}
            />
            <motion.div
              className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6 md:py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeReview}
            >
              <motion.div
                layoutId={`review-card-${selectedReview.id}`}
                className="relative w-full max-w-5xl h-full max-h-[800px] bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                    onClick={closeReview}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Video Section */}
                <div className="w-full md:w-[60%] h-[40vh] md:h-full bg-black relative group">
                    {isYouTubeUrl(selectedReview.videoUrl) ? (
                        <iframe
                            src={`https://www.youtube.com/embed/${getYouTubeId(selectedReview.videoUrl)}?autoplay=1&rel=0`}
                            className="w-full h-full object-contain"
                            allow="accelerometer; autoplay; clipbosard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : (
                        <video
                            src={selectedReview.videoUrl}
                            controls
                            autoPlay
                            playsInline
                            className="w-full h-full object-contain"
                        />
                    )}
                </div>

                {/* Content Section */}
                <div className="w-full md:w-[40%] h-full flex flex-col bg-white">
                    <div className="p-8 md:p-10 flex flex-col h-full overflow-y-auto">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-full bg-[#F2F4F7] flex items-center justify-center text-[#1B6013] font-bold text-xl">
                                {getInitials(selectedReview.customerName)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#101828]">
                                    {selectedReview.customerName}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    {selectedReview.verified && (
                                        <span className="flex items-center gap-1 text-[#1B6013] font-medium">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified Buyer
                                        </span>
                                    )}
                                    <span>•</span>
                                    <span>{formatDate(selectedReview.date)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-1 mb-6">
                            {renderStars(selectedReview.rating)}
                        </div>

                        <blockquote className="text-xl leading-relaxed text-gray-700 font-medium mb-8">
                            &ldquo;{selectedReview.description}&rdquo;
                        </blockquote>

                        {/* Linked Product/Bundle */}
                        {selectedLinkedItems.length > 0 && (
                            <div className="mt-auto pt-8 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                        Featured in this review
                                    </p>
                                </div>
                                
                                {!showAllProducts ? (
                                    <div 
                                        onClick={() => setShowAllProducts(true)}
                                        className="cursor-pointer group/stack flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors"
                                    >
                                        <div className="flex -space-x-4 pl-2">
                                            {selectedLinkedItems.slice(0, 4).map((item, i) => (
                                                <div 
                                                    key={i} 
                                                    className="relative w-14 h-14 rounded-full border-2 border-white ring-1 ring-gray-100 overflow-hidden shadow-sm transition-transform duration-300 group-hover/stack:translate-x-1"
                                                    style={{ zIndex: 10 - i }}
                                                >
                                                    {item.image ? (
                                                        <Image
                                                            src={item.image}
                                                            alt={item.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                            <ImageIcon className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {selectedLinkedItems.length > 4 && (
                                                <div 
                                                    className="relative w-14 h-14 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center z-0"
                                                >
                                                    <span className="text-xs font-semibold text-gray-500">
                                                        +{selectedLinkedItems.length - 4}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 group-hover/stack:text-[#1B6013] transition-colors">
                                                View {selectedLinkedItems.length} Product{selectedLinkedItems.length > 1 ? 's' : ''}
                                            </p>
                                            <p className="text-xs text-gray-500">Tap to see details</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        {selectedLinkedItems.map((item, i) => (
                                            <Link 
                                                key={i}
                                                href={item.href}
                                                className="group flex items-center gap-4 p-3 rounded-2xl border border-gray-100 hover:border-[#1B6013]/30 hover:bg-[#1B6013]/5 transition-all duration-300"
                                            >
                                                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                                    {item.image ? (
                                                        <Image
                                                            src={item.image}
                                                            alt={item.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <ImageIcon className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-900 group-hover:text-[#1B6013] transition-colors line-clamp-1">
                                                        {item.name}
                                                    </h4>
                                                    {item.price && (
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            {formatNaira(item.price)}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:bg-[#1B6013] group-hover:border-[#1B6013] transition-colors">
                                                    <Play className="w-3 h-3 text-gray-400 group-hover:text-white fill-current" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
