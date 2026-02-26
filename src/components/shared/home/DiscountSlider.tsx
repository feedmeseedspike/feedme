"use client";

import * as React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@components/ui/carousel";
import ProductCard from "../product/product-card";
import { IProductInput } from "src/types";
import Link from "next/link";
import { Separator } from "@components/ui/separator";
import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@utils/supabase/client";
import ProductSliderSkeleton from "../product/product-slider-skeleton";
import { Tables } from "src/utils/database.types";
import { mapSupabaseProductToIProductInput } from "src/lib/utils";
import { getDiscountedProductsQuery } from "src/queries/products";

type ProductType = Tables<"products">;

export default function DiscountSlider({
  title = "Massive 10% Off Deals",
  limit = 10,
}: {
  title?: string;
  limit?: number;
}) {
  const supabase = createClient();

  const {
    data: products,
    isLoading,
    error,
  } = useQuery<IProductInput[] | null>({
    queryKey: ["products", { tag: "discounted-home", limit }],
    queryFn: async () => {
      const { data, error } = await getDiscountedProductsQuery(supabase, limit);
      if (error) throw error;
      return (
        data?.map((p: ProductType) =>
          mapSupabaseProductToIProductInput(p, [])
        ) || null
      );
    },
  });

  if (isLoading) {
    return <ProductSliderSkeleton />;
  }

  if (error || !products || products.length === 0) {
    return null;
  }

  return (
    <section className="bg-white rounded-[8px] p-2 md:p-4">
      <div className="flex items-center justify-between text-[14px]">
        <Link href="/discounted" className="h2-bold truncate">
          <span className="text-[#F0800F]">🔥</span> {title}
        </Link>
        <Link
          href="/discounted"
          className="flex md:gap-1 items-center text-[#F0800F] whitespace-nowrap"
        >
          <p>See More</p>
          <ChevronRight className="size-[14px]" />
        </Link>
      </div>
      <Separator className="my-4" />
      <Carousel
        opts={{
          align: "start",
        }}
        className="w-full"
      >
        <CarouselContent className="px-2 md:px-[4rem]">
          {products.map((product: IProductInput) => (
            <CarouselItem key={product.slug || product.id}>
              <ProductCard hideBorder product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0" />
        <CarouselNext className="right-0" />
      </Carousel>
    </section>
  );
}
