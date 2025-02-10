'use client'

import { Progress } from '@components/ui/progress'
import Rating from './rating'
import { Separator } from '@components/ui/separator'
import Link from 'next/link'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@components/ui/popover'
import { Button } from '@components/ui/button'
import { ChevronDownIcon } from 'lucide-react'

type RatingSummaryProps = {
  asPopover?: boolean
  avgRating?: number
  numReviews?: number
  ratingDistribution: {
    rating: number
    count: number
  }[]
  hideSummaryText?: boolean 
  showTotalCount?: boolean 
}

export default function RatingSummary({
  asPopover,
  avgRating = 0,
  numReviews = 0,
  ratingDistribution = [],
  hideSummaryText = false,
  showTotalCount = false, 
}: RatingSummaryProps) {
  const RatingDistribution = () => {
    return (
      <>
        {!hideSummaryText && (
          <div className=''>
            <div className="flex flex-wrap items-center gap-1 cursor-help">
              <Rating rating={avgRating} />
              <span className='text-[14px]'>{avgRating.toFixed(1)} out of 5</span>
            </div>
            <div className='text-[14px]'>{numReviews} ratings</div>
          </div>
        )}

        <div className='space-y-3'>
          {ratingDistribution
            .sort((a, b) => b.rating - a.rating)
            .map(({ rating, count }) => (
              <div
                key={rating}
                className='flex gap-4 items-center'
              >
                <div className='flex items-center gap-1'>
                  <Rating rating={rating} />
                </div>

                <Progress value={Math.round((count / numReviews) * 100)} className='h-[6px]' />

                <div className='text-sm text-right'>
                  {showTotalCount ? `${Math.round((count / numReviews) * 100)}%` : count}
                </div>
              </div>
            ))}
        </div>
      </>
    )
  }

  return asPopover ? (
    <div className='flex items-center gap-1'>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant='ghost' className='px-2 [&_svg]:size-6 text-base'>
            <span>{avgRating.toFixed(1)}</span>
            <Rating rating={avgRating} />
            <ChevronDownIcon className='w-5 h-5 text-muted-foreground' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-4' align='end'>
          <div className='flex flex-col gap-2'>
            <RatingDistribution />
            <Separator />
            <Link className='highlight-link text-center text-[14px]' href='#reviews'>
              See customer reviews
            </Link>
          </div>
        </PopoverContent>
      </Popover>
      <div>
        <Link href='#reviews' className='highlight-link text-[14px]'>
          {numReviews} ratings
        </Link>
      </div>
    </div>
  ) : (
    <RatingDistribution />
  )
}
