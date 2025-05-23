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

export default function ProductSlider({
  title,
  products,
  hideDetails = false,
  href,
}: {
  title?: string
  products: IProductInput[]
  hideDetails?: boolean
  href?: string
}) {
  return (
    <section className='bg-white rounded-[8px] p-2 md:p-4'>
      <div className="flex items-center justify-between text-[14px] ">
        {href ? (
          <Link href={href} className='h2-bold truncate'>
            {title}
          </Link>
        ) : (
          <h2 className='h2-bold'>{title}</h2>
        )}
        {href && (
          <Link href={href} className='flex gap-1 items-center text-[#F0800F]'>
            <p>See More</p>
            <ChevronRight className="size-[14px]" />
          </Link>
        )}
      </div>
      <Separator className="my-4" />
      <Carousel
        opts={{
          align: 'start',
        }}
        className='w-full'
      >
        <CarouselContent className="px-2 md:px-[4rem]">
          {products.map((product) => (
            <CarouselItem key={product.slug}>
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