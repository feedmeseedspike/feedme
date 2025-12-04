"use client";

import * as React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@components/ui/carousel";
import Link from "next/link";
import { Separator } from "@components/ui/separator";
import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchBundles } from "src/queries/bundles";
import { Tables } from "src/utils/database.types";
import BundleCard from "./bundle-card";

export default function BundleSlider({
  title = "Popular Bundles",
  hideDetails = false,
  href = "/bundles",
  limit = 10,
  bundles,
}: {
  title?: string;
  hideDetails?: boolean;
  href?: string;
  limit?: number;
  bundles?: Tables<"bundles">[] | null;
}) {
  const {
    data: fetchedBundles,
    isLoading,
    error: fetchedError,
  } = useQuery({
    queryKey: ["bundles", { limit }],
    queryFn: () =>
      fetchBundles({
        itemsPerPage: limit,
        publishedStatus: ["published"],
      }),
    enabled: !bundles,
  });

  if (isLoading && !bundles) {
    return (
      <section className="bg-white rounded-[8px] p-2 md:p-4">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="h-1 bg-gray-200 rounded mb-4"></div>
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-48 h-64 bg-gray-200 rounded"
            ></div>
          ))}
        </div>
      </section>
    );
  }

  if ((fetchedError || !fetchedBundles?.data) && !bundles) {
    return null;
  }

  const bundlesToRender = bundles || fetchedBundles?.data;

  if (!bundlesToRender || bundlesToRender.length === 0) {
    return null;
  }

  return (
    <section className="bg-white rounded-[8px] p-2 md:p-4">
      <div className="flex items-center justify-between text-[14px]">
        {href ? (
          <Link href={href} className="h2-bold truncate">
            {title}
          </Link>
        ) : (
          <h2 className="h2-bold">{title}</h2>
        )}
        {href && (
          <Link
            href={href}
            className="flex md:gap-1 items-center text-[#F0800F] whitespace-nowrap"
          >
            <p>See More</p>
            <ChevronRight className="size-[14px]" />
          </Link>
        )}
      </div>
      <Separator className="my-4" />
      <Carousel
        opts={{
          align: "start",
        }}
        className="w-full"
      >
        <CarouselContent className="px-2 md:px-[4rem]">
          {bundlesToRender.map((bundle: Tables<"bundles">) => (
            <CarouselItem key={bundle.id}>
              <BundleCard 
                hideDetails={hideDetails}
                hideBorder
                bundle={bundle} 
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0" />
        <CarouselNext className="right-0" />
      </Carousel>
    </section>
  );
}
