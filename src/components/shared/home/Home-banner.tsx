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

  console.log("sideBanners", sideBanners);

  return (
    <section className="pt-4 pb-5 md:pt-10 md:pb-10 lg:pb-20 w-full">
      <div className="md:flex items-stretch gap-2 md:gap-4 w-full h-full">
        <div className="basis-[896px]">
          <HomeCarousel />
        </div>

        <div className="md:basis-[444px] w-full flex flex-row md:flex-col gap-2 mt-3 md:mt-0 md:gap-4">
          {isLoadingSideBanners ? (
            Array(2)
              .fill(0)
              .map((_, i) => (
                <Skeleton
                  key={i}
                  className="w-1/2 md:w-full md:h-1/2 bg-gray-200"
                />
              ))
          ) : sideBanners && sideBanners.length > 0 ? (
            sideBanners
              .filter((banner) => !!banner.id)
              .map(
                (banner: Banner) =>
                  banner.active && (
                    <Link
                      href={`/${banner.tag}`}
                      key={banner.id!}
                      className="w-1/2 md:w-full md:max-w-[445px] aspect-[35/15] h-1/2 md:h-full hover:opacity-90 transition-opacity"
                    >
                      <Image
                        src={banner.image_url}
                        alt={`${banner.tag} banner`}
                        // fill
                        sizes="(max-width: 768px) 50vw, 445px"
                        width={445}
                        height={700}
                        className="h-full w-full object-cover"
                      />
                    </Link>
                  )
              )
          ) : (
            <p>No side banners available.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Banner;
