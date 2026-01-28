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
import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@utils/supabase/client";
import { getProductsByTagQuery } from "src/queries/products";
import ProductSliderSkeleton from "../product/product-slider-skeleton";
import { Tables } from "src/utils/database.types";
import { mapSupabaseProductToIProductInput } from "src/lib/utils";
import { Separator } from "@components/ui/separator";

type ProductType = Tables<"products">;

export default function FreshSeedsSlider() {
  const supabase = createClient();
  const tag = "fresh-seeds-and-nuts";
  const limit = 10;
  const title = "Fresh Seeds & Nuts";
  const href = "/fresh-seeds-and-nuts";

  const {
    data: products,
    isLoading,
    error,
  } = useQuery<IProductInput[] | null>({
    queryKey: ["products", { tag, limit }],
    queryFn: async () => {
      let queryBuilder = getProductsByTagQuery(supabase, tag, limit);
      const { data, error } = await queryBuilder.select("*");
      if (error) throw error;
      return (
        data?.map((product: ProductType) =>
          mapSupabaseProductToIProductInput(product, [])
        ) || null
      );
    },
  });

  if (isLoading) return <ProductSliderSkeleton />;
  if (error || !products || products.length === 0) return null;

  return (
    <section className="relative overflow-hidden rounded-[8px] bg-[#F5F3EE] p-2 md:p-4 mb-6">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none mix-blend-multiply"
        style={{
            backgroundImage: "url('/images/fresh_seeds_bg.png')",
            backgroundSize: "300px",
            backgroundRepeat: "repeat"
        }}
      />
      
      {/* Gradient Overlay for Readability */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#F5F3EE]/90 via-[#F5F3EE]/50 to-[#F5F3EE]/90 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col gap-3 md:gap-4 mb-2">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-semibold tracking-wide uppercase bg-[#2C5F2D] text-white shadow-sm">
                        Nature&apos;s Power
                    </span>
                </div>
               <Link href={href} className="group flex items-center gap-2">
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#3B2F2F] tracking-tight group-hover:text-[#2C5F2D] transition-colors">
                    {title}
                </h2>
               </Link>
            </div>
            
            <Link
              href={href}
              className="hidden md:flex items-center gap-1 text-[#F0800F] font-medium hover:text-[#D67000] transition-colors whitespace-nowrap mb-1"
            >
              <span className="text-sm">View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm md:text-base text-[#5D5D5D] italic max-w-2xl leading-relaxed border-l-2 border-[#2C5F2D]/30 pl-3">
                &quot;Crunch into nature&apos;s finest energy boosters. From raw almonds to organic chia, fuel your day the natural way.&quot;
            </p>
             <Link
              href={href}
              className="md:hidden flex items-center gap-1 text-[#F0800F] font-medium whitespace-nowrap text-sm"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <Separator className="my-6 bg-[#3B2F2F]/10" />

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {products.map((product) => (
              <CarouselItem key={product.id} className="pl-4 ">
                <div className="h-full">
                  <ProductCard product={product} hideBorder className="bg-white hover:bg-white transition-colors duration-300 shadow-sm hover:shadow-md border border-[#E8F5E9]/50" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-end gap-2 mt-4 mr-2">
             <CarouselPrevious className="static translate-y-0 h-8 w-8 border-[#3B2F2F]/20 text-[#3B2F2F] hover:bg-[#3B2F2F] hover:text-white transition-colors" />
             <CarouselNext className="static translate-y-0 h-8 w-8 border-[#3B2F2F]/20 text-[#3B2F2F] hover:bg-[#3B2F2F] hover:text-white transition-colors" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
