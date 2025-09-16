"use client";

import * as React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@components/ui/carousel";
import ProductCard from "./product-card";
import { IProductInput } from "src/types";
import Link from "next/link";
import { Separator } from "@components/ui/separator";
import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@utils/supabase/client";
import { getProductsByTagQuery } from "src/queries/products";
import ProductSliderSkeleton from "./product-slider-skeleton";
import { Tables } from "src/utils/database.types";

type ProductType = Tables<"products">;
import { mapSupabaseProductToIProductInput } from "src/lib/utils";

export default function ProductSlider({
  title,
  hideDetails = false,
  href,
  tag,
  limit,
  products,
}: {
  title?: string;
  hideDetails?: boolean;
  href?: string;
  tag?: string;
  limit?: number;
  products?: IProductInput[] | null;
}) {
  const supabase = createClient();

  const queryKey = React.useMemo(
    () => ["products", { tag, limit }],
    [tag, limit]
  );

  const queryFn = React.useCallback(async () => {
    if (!tag) return null;

    let queryBuilder = getProductsByTagQuery(supabase, tag, limit);
    const { data, error } = await queryBuilder.select("*");

    if (error) throw error;

    // Map Supabase products to IProductInput
    return (
      data?.map((product: ProductType) => mapSupabaseProductToIProductInput(product, [])) ||
      null
    );
  }, [supabase, tag, limit]);

  const {
    data: fetchedProducts,
    isLoading,
    error: fetchedError,
  } = useQuery<IProductInput[] | null>({
    queryKey: queryKey,
    queryFn: queryFn,
    enabled: !!tag,
  });

  if (isLoading && !products) {
    return <ProductSliderSkeleton />;
  }

  if ((fetchedError || !fetchedProducts) && !products) {
    return <div>Error loading products or no {tag} products found.</div>;
  }

  const productsToRender = products || fetchedProducts;

  if (!productsToRender || productsToRender.length === 0) {
    return <div>No products found.</div>;
  }

  return (
    <section className="bg-white rounded-[8px] p-2 md:p-4">
      <div className="flex items-center justify-between text-[14px] ">
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
          {productsToRender.map((product: IProductInput) => (
            <CarouselItem key={product.slug || product.id}>
              <ProductCard
                hideDetails={hideDetails}
                hideAddToCart
                hideBorder
                product={product}
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
