"use client";

import Container from "@components/shared/Container";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@utils/supabase/client";
import { Tables } from "src/utils/database.types";
import { Skeleton } from "@components/ui/skeleton";
import { HomeCarousel } from "@/components/shared/home/Home-carousel";
import { toSlug } from "src/lib/utils";

type Banner = Tables<"banners">;

// This would typically come from your database/API
// const banners = [
//   {
//     id: 1,
//     imageUrl: "/banners/banner3.png",
//     tag: "todays-deal",
//     active: true,
//   },
//   {
//     id: 2,
//     imageUrl: "/banners/banner4.png",
//     tag: "fresh-fruits",
//     active: true,
//   },
// ];

const Banner = () => {
  const supabase = createClient();
  const { data: sideBanners, isLoading: isLoadingSideBanners } = useQuery<
    Banner[]
  >({
    queryKey: ["sideBanners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("type", "side")
        .order("order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  return (
    <section className="pt-4 pb-5 md:pt-6 md:pb-6 lg:pb-12 w-full">
      <div className="flex flex-col lg:flex-row items-stretch gap-4 md:gap-6 w-full">
        {/* Main Carousel Area */}
        <div className="w-full lg:w-[68%] xl:w-[70%]">
          <HomeCarousel />
        </div>

        {/* Side Banners Area */}
        <div className="w-full lg:w-[32%] xl:w-[30%] flex flex-row lg:flex-col gap-3 md:gap-4">
          {isLoadingSideBanners ? (
            Array(2)
              .fill(0)
              .map((_, i) => (
                <Skeleton
                  key={i}
                  className="w-1/2 lg:w-full aspect-[21/9] lg:aspect-auto lg:h-[220px] rounded-2xl bg-gray-200"
                />
              ))
          ) : sideBanners && sideBanners.length > 0 ? (
            sideBanners
              .filter((banner) => !!banner.id)
              .map(
                (banner: Banner) =>
                  banner.active && (
                    <div
                      key={banner.id!}
                      className="w-1/2 lg:w-full h-auto aspect-[35/15] lg:flex-1 overflow-hidden"
                    >
                      {(() => {
                        const b = banner as any;
                        const hasLink = (b.link_url && b.link_url.trim() !== "") || 
                                        (b.bundle_id && b.bundles?.name) || 
                                        (b.tag && b.tag.trim() !== "");
                        
                        let href = b.link_url || "/";
                        if (!b.link_url) {
                          if (b.bundle_id && b.bundles?.name) {
                            href = `/bundles/${toSlug(b.bundles.name)}`;
                          } else if (b.tag) {
                            href = `/${b.tag}`;
                          }
                        }

                        const ImageContent = (
                          <div className="relative w-full h-full">
                            <Image
                              src={banner.image_url || "https://placehold.co/600x400/png"}
                              alt={`${banner.tag} banner`}
                              fill
                              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 30vw, 450px"
                              loading="lazy"
                              className="object-cover"
                            />
                          </div>
                        );

                        if (hasLink) {
                          return (
                            <Link
                              href={href}
                              className="block h-full w-full hover:opacity-95 transition-opacity"
                            >
                              {ImageContent}
                            </Link>
                          );
                        }

                        return ImageContent;
                      })()}
                    </div>
                  )
              )
          ) : (
            <p className="text-gray-400 text-sm">No side banners available.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Banner;
