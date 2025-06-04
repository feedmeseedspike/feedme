"use client";

import * as React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@components/ui/carousel";
import { Separator } from "@components/ui/separator";
import { Skeleton } from "@components/ui/skeleton";

export default function ProductSliderSkeleton() {
  return (
    <section className="bg-white rounded-[8px] p-2 md:p-4">
      <div className="flex items-center justify-between text-[14px] ">
        <Skeleton className="h-6 w-40" />
      </div>
      <Separator className="my-4" />
      <Carousel
        opts={{
          align: "start",
        }}
        className="w-full"
      >
        <CarouselContent className="px-2 md:px-[4rem]">
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem
              key={index}
              className="basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
            >
              <div className="flex flex-col space-y-3">
                <Skeleton className="h-[125px] w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[calc(100%-50px)]" />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
