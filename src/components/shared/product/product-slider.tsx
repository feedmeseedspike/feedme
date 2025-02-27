
'use client'

import * as React from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@components/ui/carousel'
import ProductCard from './product-card'
import { IProductInput } from 'src/types'
import Link from "next/link"
import { Separator } from '@components/ui/separator'
import {ChevronRight} from "lucide-react"
import  ArrowRight  from '@components/icons/ArrowRight.svg'

export default function ProductSlider({
  title,
  products,
  hideDetails = false,
}: {
  title?: string
  products: IProductInput[]
  hideDetails?: boolean
}) {
  return (
    <section className='bg-white rounded-[8px] p-4'>
      <div className="flex items-center justify-between text-[14px] ">
        <h2 className='h2-bold '>{title}</h2>
        <Link href={""} className='flex gap-1 items-center text-[#F0800F]'>
          <p  >See More</p>
          <ChevronRight className="size-[14px]" />
        </Link>
      </div>
      <Separator className="my-4" />
      <Carousel
        opts={{
          align: 'start',
        }}
        className='w-full'
      >
        <CarouselContent className="px-2  md:px-[4rem]">
          {products.map((product) => (
            <CarouselItem
              key={product.slug}
              // className={
              //   hideDetails
              //     ? 'md:basis-1/4 lg:basis-1/6'
              //     : 'md:basis-1/3 lg:basis-1/5'
              // }
            >
              <ProductCard
                hideDetails={hideDetails}
                hideAddToCart
                hideBorder
                product={product}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className='left-0' />
        <CarouselNext className='right-0' />
      </Carousel>
    </section>
  )
}
