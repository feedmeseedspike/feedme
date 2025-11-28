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

export default function BlackFridaySlider({
  title,
  href,
  products,
}: {
  title?: string;
  href?: string;
  products: IProductInput[];
}) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden rounded-[16px] p-4 md:p-6 mb-8">
      {/* Noisy Background */}
      <div className="absolute inset-0 bg-[#052E16] z-0">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Gradient Overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/20" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between text-[14px] mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {title}
          </h2>
          {href && (
            <Link
              href={href}
              className="flex md:gap-1 items-center text-[#F0800F] hover:text-[#ff9533] transition-colors whitespace-nowrap font-medium"
            >
              <p>View All</p>
              <ChevronRight className="size-[16px]" />
            </Link>
          )}
        </div>

        <Carousel
          opts={{
            align: "start",
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {products.map((product) => (
              <CarouselItem key={product.slug || product.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/5">
                <div className="bg-white rounded-xl p-2 h-full">
                  <ProductCard
                    hideBorder
                    product={product}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-[-10px] bg-white/90 hover:bg-white text-[#052E16] border-none" />
          <CarouselNext className="right-[-10px] bg-white/90 hover:bg-white text-[#052E16] border-none" />
        </Carousel>
      </div>
    </section>
  );
}
