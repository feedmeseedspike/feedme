'use client'
// import useSettingStore from '@/hooks/use-setting-store'
import { cn, formatNaira } from '../../../lib/utils'
// import { useFormatter, useTranslations } from 'next-intl'

const ProductPrice = ({
  price,
  className,
  listPrice = 0,
  isDeal = false,
  forListing = true,
  plain = false,
}: {
  price: number
  isDeal?: boolean
  listPrice?: number
  className?: string
  forListing?: boolean
  plain?: boolean
}) => {
  const formattedPrice = formatNaira(price)
  const formattedListPrice = formatNaira(listPrice)
  const discountPercent = Math.round(100 - (price / listPrice) * 100)

  return plain ? (
    formattedPrice
  ) : listPrice === 0 ? (
    <div className={cn('text-xl', className)}>{formattedPrice}</div>
  ) : isDeal ? (
    <div className='space-y-2'>
      <div className='flex items-center gap-2'>
        <span className='absolut bg-red-600 rounded-[3px] px-3  py-1 text-white text-xs font-semibold whitespace-nowrap'>
          {discountPercent}% Off
        </span>
        <span className='text-red-600 text-[10px] font-bold'>Limited time deal</span>
      </div>
      <div className={`flex ${forListing && ''} items-center gap-2`}>
        <div className={cn('text-xl', className)}>{formattedPrice}</div>
        <div className='text-muted-foreground text-xs py-2'>
          Was: <span className='line-through'>{formattedListPrice}</span>
        </div>
      </div>
    </div>
  ) : (
    <div>
      <div className='flex gap-2 items-center'>
        {/* <div className='text-3xl text-orange-700'>-{discountPercent}%</div> */}
        <div className={cn('text-xl', className)}>{formattedPrice}</div>
        <span className='line-through text-xs '>{formattedListPrice}</span>
      </div>
      {/* <div className='text-muted-foreground text-xs py-2'>
      </div> */}
    </div>
  )
}

export default ProductPrice
