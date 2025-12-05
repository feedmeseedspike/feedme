"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Play, Star, X } from "lucide-react";
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
  linkPreference?: {
    type: "product" | "bundle" | "offer";
    slot?: number;
  };
  fallbackRelatedItem?: {
    name: string;
    href: string;
    type: "product" | "bundle" | "offer";
    image?: string;
  };
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

const defaultReviews: Review[] = [
  {
    id: "1",
    customerName: "Sarah Johnson",
    rating: 5,
    description:
      "Absolutely love the fresh produce! The quality is amazing and delivery was super fast. Highly recommend!",
    videoUrl: "/customerReviews/video1.mp4",

    verified: true,
    date: "2025-11-22",
    linkPreference: {
      type: "product",
      slot: 0,
    },
    fallbackRelatedItem: {
      name: "Fresh Vegetables Bundle",
      href: "/bundles/fresh-vegetables",
      type: "bundle",
      image: "/images/review-thumb-1.jpg",
    },
  },
  {
    id: "2",
    customerName: "Adigun Zainab",
    rating: 5,
    description:
      "Best grocery delivery service I've used. Everything arrived fresh and on time. Will definitely order again!",
    videoUrl: "/customerReviews/video2.mp4",

    verified: true,
    date: "2025-11-15",
    linkPreference: {
      type: "offer",
      slot: 0,
    },
    fallbackRelatedItem: {
      name: "Premium Fruits Collection",
      href: "/offers/premium-fruits",
      type: "offer",
      image: "/images/review-thumb-2.jpg",
    },
  },
  {
    id: "3",
    customerName: "Amina Okafor",
    rating: 5,
    description:
      "The quality exceeded my expectations. Fresh, organic, and delivered right to my doorstep. Amazing service!",
    videoUrl: "/customerReviews/video3.mp4",

    verified: true,
    date: "2025-11-19",
    linkPreference: {
      type: "product",
      slot: 1,
    },
    fallbackRelatedItem: {
      name: "Organic Produce Box",
      href: "/products/organic-produce-box",
      type: "product",
      image: "/images/review-thumb-3.jpg",
    },
  },
  {
    id: "4",
    customerName: "Blessing Okonkwo",
    rating: 5,
    description:
      "Fast delivery and excellent customer service. The tomatoes were so fresh, tasted like they were just picked!",
    videoUrl: "/customerReviews/video4.mp4",

    verified: true,
    date: "2025-11-10",
    linkPreference: {
      type: "bundle",
      slot: 0,
    },
    fallbackRelatedItem: {
      name: "Seasonal Fruits Pack",
      href: "/bundles/seasonal-fruits",
      type: "bundle",
      image: "/images/review-thumb-4.jpg",
    },
  },
];

export default function CustomerReviews({
  reviews = defaultReviews,
}: CustomerReviewsProps) {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [selectedLinkedItem, setSelectedLinkedItem] =
    useState<ResolvedLinkedItem | null>(null);
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
    if (isDesktop) return 4;
    if (isTablet) return 3;
    return 2;
  }, [isDesktop, isTablet]);

  const slideWidth = useMemo(() => {
    if (isDesktop) {
      return "calc(25% - 12px)";
    }
    if (isTablet) {
      return "calc(33.333% - 12px)";
    }
    return "calc(50vw - 12px)";
  }, [isDesktop, isTablet]);

  const carouselOpts = useMemo(
    () => ({
      loop: reviews.length > slidesPerView,
      align: "start" as const,
    }),
    [reviews.length, slidesPerView]
  );

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();
    const fetchLinkedEntities = async () => {
      try {
        const [productsResult, bundlesResult, offersResult] = await Promise.all(
          [
            supabase
              .from("products")
              .select("id,name,slug,images,price,is_published")
              .eq("is_published", true)
              .order("num_sales", { ascending: false })
              .limit(8),
            supabase
              .from("bundles")
              .select(
                "id,name,price,thumbnail_url,published_status,stock_status"
              )
              .eq("published_status", "published")
              .order("created_at", { ascending: false })
              .limit(6),
            supabase
              .from("offers")
              .select("id,title,image_url,price_per_slot,status")
              .order("created_at", { ascending: false })
              .limit(6),
          ]
        );

        if (!isMounted) return;

        setLinkedCollections({
          products: productsResult.data ?? [],
          bundles: bundlesResult.data ?? [],
          offers: offersResult.data ?? [],
        });
      } catch (error) {
        console.error("Failed to load showcase links for reviews", error);
      } finally {
        // intentionally left blank
      }
    };

    fetchLinkedEntities();

    return () => {
      isMounted = false;
    };
  }, []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating
            ? "fill-[#F2C94C] text-[#F2C94C]"
            : "fill-gray-300 text-gray-300"
        }`}
      />
    ));
  };

  const typeLabelMap: Record<ResolvedLinkedItem["type"], string> = {
    product: "Product",
    bundle: "Bundle",
    offer: "Offer",
  };

  const resolveLinkedItem = useCallback(
    (review: Review): ResolvedLinkedItem | null => {
      const pickFromList = <T,>(list: T[], slot = 0): T | null => {
        if (!list || list.length === 0) return null;
        const normalizedSlot =
          ((slot % list.length) + list.length) % list.length;
        return list[normalizedSlot];
      };

      if (review.linkPreference) {
        const { type, slot = 0 } = review.linkPreference;
        if (type === "product") {
          const product = pickFromList(linkedCollections.products, slot);
          if (product) {
            return {
              type,
              name: product.name,
              href: `/product/${product.slug}`,
              image: Array.isArray(product.images)
                ? ((product.images[0] as string | undefined) ?? null)
                : null,
              price: product.price,
            };
          }
        }
        if (type === "bundle") {
          const bundle = pickFromList(linkedCollections.bundles, slot);
          if (bundle) {
            return {
              type,
              name: bundle.name,
              href: `/bundles/${toSlug(bundle.name)}`,
              image: bundle.thumbnail_url,
              price: bundle.price,
            };
          }
        }
        if (type === "offer") {
          const offer = pickFromList(linkedCollections.offers, slot);
          if (offer) {
            return {
              type,
              name: offer.title,
              href: `/offers/${toSlug(offer.title)}`,
              image: offer.image_url,
              price: offer.price_per_slot,
            };
          }
        }
      }

      if (review.fallbackRelatedItem) {
        return {
          type: review.fallbackRelatedItem.type,
          name: review.fallbackRelatedItem.name,
          href: review.fallbackRelatedItem.href,
          image: review.fallbackRelatedItem.image,
          price: null,
          isFallback: true,
        };
      }

      return null;
    },
    [linkedCollections]
  );

  const closeReview = useCallback(() => setSelectedReview(null), []);

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
      return parsed.toLocaleDateString("en-US");
    }
    return value;
  };

  useEffect(() => {
    const videos: HTMLVideoElement[] = [];
    let cancelled = false;

    reviews.forEach((review) => {
      if (review.thumbnailUrl || generatedThumbnails[review.id]) return;

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
      setSelectedLinkedItem(null);
      return;
    }
    setSelectedLinkedItem(resolveLinkedItem(selectedReview));
  }, [selectedReview, resolveLinkedItem]);

  return (
    <>
      <section className="py-12 bg-white">
        {/* <Container> */}
        <div className="mb-8 text-center px-4">
          <h2 className="text-3xl font-bold text-[#1B6013] mb-2">
            What Our Customers Say
          </h2>
          <p className="text-gray-600">Real reviews from verified customers</p>
        </div>

        <div className="w-full overflow-hidden">
          <Carousel opts={carouselOpts} isScale={true}>
            <SliderContainer>
              {reviews.map((review, index) => {
                const resolvedLinkedItem = resolveLinkedItem(review);
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
                    className="w-full h-full"
                  >
                    <motion.article
                      layoutId={`review-card-${review.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="relative group/card h-fit cursor-pointer"
                      onClick={() => setSelectedReview(review)}
                    >
                      <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-[#E6F4EA] via-white to-[#FDF4E7] opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
                      <div className="relative z-10 h-full rounded-[28px] border border-[#E4E7EC] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)] flex flex-col overflow-hidden">
                        <motion.div
                          layoutId={`review-media-${review.id}`}
                          className="relative w-full h-[320px] sm:h-[360px] lg:h-[420px] overflow-hidden"
                        >
                          {(() => {
                            const thumbnailSrc =
                              review.thumbnailUrl ||
                              generatedThumbnails[review.id];
                            const resolvedItem = resolveLinkedItem(review);
                            
                            if (thumbnailSrc) {
                              return (
                                <video
                                  // Seek to ~0.5s to ensure a visible frame
                                  src={`${review.videoUrl}#t=0.5`}
                                  poster={thumbnailSrc}
                                  muted
                                  playsInline
                                  preload="metadata"
                                  controls={false}
                                  className="absolute inset-0 h-full w-full object-cover bg-[#E6F4EA]"
                                  onLoadedMetadata={(event) => {
                                    const videoEl = event.currentTarget;
                                    try {
                                      videoEl.currentTime = Math.min(
                                        0.5,
                                        videoEl.duration || 0.5
                                      );
                                    } catch {
                                      // ignore seek issues
                                    }
                                    videoEl.pause();
                                  }}
                                  aria-label={`${review.customerName} review preview`}
                                />
                              );
                            }
                            
                            // Fallback: Show linked item image, customer initials, or gradient
                            if (resolvedItem?.image) {
                              return (
                                <div className="absolute inset-0">
                                  <Image
                                    src={resolvedItem.image}
                                    alt={resolvedItem.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                </div>
                              );
                            }
                            
                            // Fallback: Show customer initials with gradient background
                            return (
                              <div className="absolute inset-0 bg-gradient-to-br from-[#1B6013] via-[#2E7D32] to-[#4CAF50] flex items-center justify-center">
                                <div className="text-center">
                                  <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 mx-auto border-2 border-white/30">
                                    <span className="text-4xl font-bold text-white">
                                      {getInitials(review.customerName)}
                                    </span>
                                  </div>
                                  <p className="text-white/90 text-sm font-medium px-4">
                                    {review.customerName}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                          <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/25 transition-colors flex items-center justify-center pointer-events-none">
                            <Play className="w-14 h-14 text-white opacity-90 drop-shadow-lg" />
                          </div>
                        </motion.div>
                        <div className="relative flex flex-col gap-4 px-6 pb-6 pt-10 h-full min-h-[260px]">
                          <div className="absolute -top-7 left-6 flex items-center gap-2">
                            <div className="w-14 h-14 rounded-full bg-white border border-[#E4E7EC] flex items-center justify-center font-semibold text-[#1B6013] shadow-[0_6px_18px_rgba(15,23,42,0.08)]">
                              {getInitials(review.customerName)}
                            </div>
                            {review.verified && (
                              <div className="flex items-center text-[#F2C94C]">
                                <CheckCircle2 className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-semibold text-[#1D2939] text-lg">
                              {review.customerName}
                            </h3>
                            {review.date && (
                              <p className="text-xs text-[#475467] uppercase tracking-[0.2em]">
                                {formatDate(review.date)}
                              </p>
                            )}
                          </div>
                          <p className="text-sm text-[#1D2939] leading-relaxed flex-1 italic line-clamp-4">
                            “{review.description}”
                          </p>
                        </div>
                      </div>
                    </motion.article>
                  </Slider>
                );
              })}
            </SliderContainer>
            <SliderPrevButton />
            <SliderNextButton />
            <div className="flex justify-center py-2 md:py-3">
              <SliderDotButton />
            </div>
          </Carousel>
        </div>
        {/* </Container> */}
      </section>
      <AnimatePresence>
        {selectedReview && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeReview}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeReview}
            >
              <motion.div
                layoutId={`review-card-${selectedReview.id}`}
                className="relative w-full max-w-4xl h-[90vh]"
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.98 }}
                transition={{ type: "spring", damping: 18, stiffness: 180 }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="absolute -inset-1 opacity-60" />
                <div
                  className="relative bg-white/95 rounded-md border border-white/40 
                 h-full overflow-hidden flex flex-col"
                >
                  <button
                    onClick={closeReview}
                    className="absolute top-4 right-4 z-10 rounded-full p-2 bg-white/80 hover:bg-white text-gray-600 transition"
                    aria-label="Close review modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex flex-col lg:flex-row h-full">
                    <motion.div
                      layoutId={`review-media-${selectedReview.id}`}
                      className="relative w-full lg:w-[58%] h-[45vh] lg:h-full bg-black flex items-center justify-center"
                    >
                      <video
                        src={selectedReview.videoUrl}
                        controls
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-4 left-4 bg-black/60 text-white px-4 py-2 rounded-full text-xs font-medium uppercase tracking-[0.2em]">
                        Customer Story
                      </div>
                    </motion.div>
                    <div className="w-full lg:w-[42%] p-8 flex flex-col justify-between gap-6 overflow-y-auto h-[40vh] lg:h-full">
                      <div className="flex flex-col gap-4 justify-between">
                        <div>
                          <p className="text-sm uppercase tracking-[0.2em] text-[#475467]">
                            Spotlight
                          </p>
                          <h3 className="text-2xl font-bold text-[#101828] mt-1">
                            {selectedReview.customerName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-[#F2C94C]">
                            {renderStars(selectedReview.rating)}
                          </div>
                          {selectedReview.date && (
                            <span className="text-sm text-gray-500">
                              {selectedReview.date}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-base leading-relaxed">
                          {selectedReview.description}
                        </p>
                      </div>
                      {/* {selectedLinkedItem && (
                        <div className=" border-t mb-4 border-[#EAECF0] flex flex-col gap-4 ">
                          <div className="flex items-center gap-3 mt-2">
                            {selectedLinkedItem.image ? (
                              <Image
                                src={selectedLinkedItem.image}
                                alt={selectedLinkedItem.name}
                                width={56}
                                height={56}
                                className="rounded-xl object-cover"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-[#ECFDF3] flex items-center justify-center text-[#1B6013] font-semibold">
                                {selectedLinkedItem.name[0]}
                              </div>
                            )}
                            <div>
                              <p className="text-xs uppercase tracking-[0.3em] text-[#475467]">
                                {typeLabelMap[selectedLinkedItem.type]}
                              </p>
                              <p className="text-lg font-semibold text-[#1B6013]">
                                {selectedLinkedItem.name}
                              </p>
                              {selectedLinkedItem.price ? (
                                <p className="text-sm text-[#475467]">
                                  {formatNaira(selectedLinkedItem.price)}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <Link
                            href={selectedLinkedItem.href}
                            className="inline-flex rounded-md w-fit bg-[#1B6013] text-white text-sm py-2 px-4 hover:bg-[#15490e] transition"
                          >
                            View {typeLabelMap[selectedLinkedItem.type]}
                          </Link>
                        </div>
                      )} */}
                    </div>
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
