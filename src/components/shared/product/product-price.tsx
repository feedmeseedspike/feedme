'use client'; // Add this directive since the component uses client-side utilities

import { cn, formatNaira } from '../../../lib/utils';

const ProductPrice = ({
  price,
  className,
  listPrice = 0,
  isDeal = false,
  forListing = true,
  plain = false,
}: {
  price: number;
  isDeal?: boolean;
  listPrice?: number;
  className?: string;
  forListing?: boolean;
  plain?: boolean;
}) => {
  const formattedPrice = formatNaira(price);
  const formattedListPrice = formatNaira(listPrice);

  return plain ? (
    formattedPrice
  ) : listPrice === 0 ? (
    <div className={cn('text-xl', className)}>{formattedPrice}</div>
  ) : isDeal ? (
    <div className="space-y-2">
      <div className={`flex ${forListing && ''} items-center gap-2`}>
        <div className={cn('text-xl', className)}>{formattedPrice}</div>
        <div className="text-muted-foreground text-xs py-2">
          Was: <span className="line-through">{formattedListPrice}</span>
        </div>
      </div>
    </div>
  ) : (
    <div>
      <div className="flex gap-2 items-center">
        <div className={cn('text-xl', className)}>{formattedPrice}</div>
        <span className="line-through text-xs">{formattedListPrice}</span>
      </div>
    </div>
  );
};

export default ProductPrice;