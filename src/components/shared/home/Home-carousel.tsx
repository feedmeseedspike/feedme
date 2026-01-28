"use client";

import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { motion, useMotionValue } from "framer-motion";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@utils/supabase/client";
import { Tables } from "src/utils/database.types";
import { Skeleton } from "@components/ui/skeleton";
import Link from "next/link";
import { toSlug } from "src/lib/utils";

type Banner = Tables<"banners"> & {
  bundles?: Tables<"bundles"> | null;
};

type BannerWithBundle = Tables<"banners"> & {
  bundles: Tables<"bundles">;
};

// const imgs = ["/banners/banner1.jpg", "/banners/banner2.png"];

const ONE_SECOND = 1000;
const AUTO_DELAY = ONE_SECOND * 10;
const DRAG_BUFFER = 50;

const SPRING_OPTIONS = {
  type: "spring" as const,
  mass: 3,
  stiffness: 400,
  damping: 50,
};

export const HomeCarousel = () => {
  const supabase = createClient();
  const { data: carouselBanners, isLoading: isLoadingCarousel } = useQuery<
    Banner[]
  >({
    queryKey: ["carouselBanners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*, bundles(*)")
        .eq("type", "carousel")
        .eq("active", true)
        .order("order", { ascending: true });
      if (error) throw error;
      return (
        (data as (Tables<"banners"> & {
          bundles?: Tables<"bundles"> | null;
        })[]) || []
      );
    },
    staleTime: 1000 * 60 * 10,
  });

  const [imgIndex, setImgIndex] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Prepare banners with a clone for infinite loop
  const bannersWithClone = React.useMemo(() => {
    if (!carouselBanners || carouselBanners.length === 0) return [];
    return [...carouselBanners, carouselBanners[0]];
  }, [carouselBanners]);

  const handleNext = React.useCallback(() => {
    if (isAnimating) return;
    setImgIndex((pv) => pv + 1);
  }, [isAnimating]);

  useEffect(() => {
    if (!hasMounted || !carouselBanners || carouselBanners.length === 0) return;

    const intervalRef = setInterval(() => {
      handleNext();
    }, AUTO_DELAY);

    return () => clearInterval(intervalRef);
  }, [hasMounted, carouselBanners, handleNext]);

  const handlePrev = () => {
    if (isAnimating) return;
    if (imgIndex === 0) {
      // Logic for prev loop if needed, but we focus on next loop for auto-slider
      return;
    }
    setImgIndex((pv) => pv - 1);
  };

  // Reset logic for infinite loop
  useEffect(() => {
    if (imgIndex === bannersWithClone.length - 1) {
      const timer = setTimeout(() => {
        setIsAnimating(true); // Temporarily disable animating to prevent jump flicker
        setImgIndex(0);
      }, 500); // Wait for transition to finish (matches SPRING_OPTIONS duration roughly)
      return () => clearTimeout(timer);
    }
  }, [imgIndex, bannersWithClone.length]);

  const onDragEnd = (event: any, info: { offset: { x: number } }) => {
    if (!carouselBanners) return;
    const { x } = info.offset;
    if (x < -DRAG_BUFFER && imgIndex < bannersWithClone.length - 2) {
      handleNext();
    } else if (x > DRAG_BUFFER && imgIndex > 0) {
      handlePrev();
    }
  };

  if (!hasMounted || isLoadingCarousel)
    return <Skeleton className="w-full h-64 md:h-[450px] bg-gray-200" />;
  
  if (!carouselBanners || carouselBanners.length === 0)
    return null;

  const realIndex = imgIndex % carouselBanners.length;

  return (
    <div className="relative bg-white w-full overflow-hidden group pb-2">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        style={{
          width: `${bannersWithClone.length * 100}%`,
          display: "flex",
        }}
        animate={{
          x: `-${imgIndex * (100 / bannersWithClone.length)}%`,
        }}
        transition={imgIndex === 0 && isAnimating ? { duration: 0 } : SPRING_OPTIONS}
        onAnimationComplete={() => setIsAnimating(false)}
        onDragEnd={onDragEnd}
        className="h-full"
      >
        <Images carouselBanners={bannersWithClone} imgIndex={imgIndex} />
      </motion.div>

      {/* Navigation Arrows (Visible on hover) */}
      <button 
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 disabled:hidden"
        disabled={imgIndex === 0}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#1B6013]"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <button 
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#1B6013]"><path d="m9 18 6-6-6-6"/></svg>
      </button>

      <Dots
        imgIndex={realIndex}
        setImgIndex={setImgIndex}
        totalDots={carouselBanners.length}
      />
    </div>
  );
};

const Images = ({
  carouselBanners,
  imgIndex,
}: {
  carouselBanners: Banner[];
  imgIndex: number;
}) => {
  return (
    <>
      {carouselBanners
        .filter((banner) => !!banner.id)
        .map((banner, idx) => {
          const b = banner as any;
          const hasLink = (b.link_url && b.link_url.trim() !== "") || 
                          (b.bundle_id && b.bundles?.name) || 
                          (b.tag && b.tag.trim() !== "");
          
          let linkHref = b.link_url || "/";
          if (!b.link_url) {
            if (b.bundle_id && b.bundles?.name) {
              linkHref = `/bundles/${toSlug(b.bundles.name)}`;
            } else if (b.tag) {
              linkHref = `/${b.tag}`;
            }
          }

          const altText = banner.bundle_id
            ? `${banner.bundles?.name || "Bundle"} banner`
            : `${banner.tag || "Carousel"} banner`;

          const imageUrl = banner.bundle_id
            ? banner.bundles?.thumbnail_url ||
              "https://placehold.co/1200x600/png"
            : banner.image_url || "https://placehold.co/1200x600/png";

          const ImageContent = (
            <motion.div
              transition={SPRING_OPTIONS}
              className="w-full h-full"
            >
              <Image
                src={imageUrl}
                alt={altText}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 1200px"
                priority={idx === imgIndex}
                className=" w-full h-full"
              />
            </motion.div>
          );

          if (hasLink) {
            return (
              <Link
                href={linkHref}
                key={banner.id!}
                className="relative w-full max-w-[1200px] aspect-[70/35] md:aspect-[70/30] overflow-hidden hover:opacity-90 transition-opacity"
              >
                {ImageContent}
              </Link>
            );
          }

          return (
            <div
              key={banner.id!}
              className="relative w-full max-w-[1200px] aspect-[70/35] md:aspect-[70/30] overflow-hidden"
            >
              {ImageContent}
            </div>
          );
        })}
    </>
  );
};

const Dots = ({
  imgIndex,
  setImgIndex,
  totalDots,
}: {
  imgIndex: number;
  setImgIndex: Dispatch<SetStateAction<number>>;
  totalDots: number;
}) => {
  return (
    <div className="mt-4 flex w-full justify-center gap-2">
      {Array(totalDots)
        .fill(0)
        .map((_, idx) => {
          return (
            <button
              key={idx}
              onClick={() => setImgIndex(idx)}
              className={`size-[6px] md:size-[10px] rounded-full transition-colors ${
                idx === imgIndex ? "bg-[#4A4A4A]" : "bg-[#D8D8D8]"
              }`}
            />
          );
        })}
    </div>
  );
};

// const GradientEdges = () => {
//   return (
//     <>
//       <div className="pointer-events-none absolute bottom-0 left-0 top-0 w-[10vw] max-w-[100px] bg-gradient-to-r from-neutral-950/50 to-neutral-950/0" />
//       <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-[10vw] max-w-[100px] bg-gradient-to-l from-neutral-950/50 to-neutral-950/0" />
//     </>
//   );
// };
