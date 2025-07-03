"use client";

import React, { useMemo } from "react";
import { cn, formatNaira } from "../../../lib/utils";

const ProductPrice = React.memo(
  ({
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
    const formattedPrice = useMemo(() => formatNaira(price), [price]);
    const formattedListPrice = useMemo(
      () => formatNaira(listPrice),
      [listPrice]
    );

    if (plain) {
      return formattedPrice;
    }

    if (listPrice === 0) {
      return <div className={cn("text-lg font-bold", className)}>{formattedPrice}</div>;
    }

    if (isDeal) {
      return (
        <div className="space-y-2">
          <div className={`flex ${forListing && ""} items-center gap-2`}>
            <div className={cn("text-lg font-bold", className)}>{formattedPrice}</div>
            {/* <div className="text-muted-foreground text-xs py-2">
            Was: <span className="line-through">{formattedListPrice}</span>
          </div> */}
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="flex gap-2 items-center">
          <div className={cn("text-lg font-bold", className)}>{formattedPrice}</div>
          {/* <span className="line-through text-xs">{formattedListPrice}</span> */}
        </div>
      </div>
    );
  }
);

ProductPrice.displayName = "ProductPrice";

export default ProductPrice;
