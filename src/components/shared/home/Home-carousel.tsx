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

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || !carouselBanners || carouselBanners.length === 0) return;

    const intervalRef = setInterval(() => {
      setImgIndex((pv) => {
        if (pv === (carouselBanners?.length || 0) - 1) {
          return 0;
        }
        return pv + 1;
      });
    }, AUTO_DELAY);

    return () => clearInterval(intervalRef);
  }, [hasMounted, carouselBanners]);

  const onDragEnd = (event: any, info: { offset: { x: number } }) => {
    if (!carouselBanners) return;
    const { x } = info.offset;
    if (x < -DRAG_BUFFER && imgIndex < (carouselBanners?.length || 0) - 1) {
      setImgIndex((pv) => pv + 1);
    } else if (x > DRAG_BUFFER && imgIndex > 0) {
      setImgIndex((pv) => pv - 1);
    }
  };

  useEffect(() => {
    // Reset index if banners change or become empty
    if (!carouselBanners || (carouselBanners?.length || 0) <= imgIndex) {
      setImgIndex(0);
    }
  }, [carouselBanners, imgIndex]);

  if (!hasMounted || isLoadingCarousel)
    return <Skeleton className="w-full h-64 md:h-96 bg-gray-200" />;
  if (!carouselBanners || carouselBanners.length === 0)
    return <p>No carousel banners available.</p>;

  return (
    <div className="relative bg-white w-full overflow-hidden">
      <motion.div
        key={imgIndex}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        style={{
          width: `${carouselBanners.length * 100}%`,
          display: "flex",
        }}
        animate={{
          transform: `translateX(-${imgIndex * (100 / carouselBanners.length)}%)`,
        }}
        transition={SPRING_OPTIONS}
        onDragEnd={onDragEnd}
        className=" size-full"
      >
        <Images carouselBanners={carouselBanners} imgIndex={imgIndex} />
      </motion.div>

      <Dots
        imgIndex={imgIndex}
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
          const linkHref = banner.bundle_id && banner.bundles?.name
            ? `/bundles/${toSlug(banner.bundles.name)}`
            : `/${banner.tag}`;

          const altText = banner.bundle_id
            ? `${banner.bundles?.name || "Bundle"} banner`
            : `${banner.tag || "Carousel"} banner`;

          const imageUrl = banner.bundle_id
            ? banner.bundles?.thumbnail_url ||
              "https://placehold.co/1200x600/png"
            : banner.image_url;

          return (
            <Link
              href={linkHref}
              key={banner.id!}
              className="relative w-full max-w-[1200px] aspect-[70/35] md:aspect-[70/30] overflow-hidden hover:opacity-90 transition-opacity"
            >
              <motion.div
                // animate={{
                //   scale: imgIndex === idx ? 0.95 : 0.85,
                // }}
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
            </Link>
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
