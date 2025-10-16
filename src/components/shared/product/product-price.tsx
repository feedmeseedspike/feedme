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
    const discountPercent = useMemo(() => {
      if (
        typeof listPrice === "number" &&
        listPrice > 0 &&
        price > 0 &&
        listPrice > price
      ) {
        return Math.round(100 - (price / listPrice) * 100);
      }
      return 0;
    }, [price, listPrice]);

    if (plain) {
      return formattedPrice;
    }

    if (listPrice === 0) {
      return (
        <div className={cn("text-lg font-bold", className)}>
          {formattedPrice}
        </div>
      );
    }

    if (isDeal) {
      return (
        <div className="space-y-2">
          <div className={`flex ${forListing && ""} items-center gap-2`}>
            <div className={cn("text-lg font-bold", className)}>
              {formattedPrice}
            </div>
            {/* <div className="text-muted-foreground text-xs py-2">
            Was: <span className="line-through">{formattedListPrice}</span>
          </div> */}
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-center gap-2">
          <div className={cn("text-lg font-bold", className)}>
            {formattedPrice}
          </div>
          {listPrice > price && (
            <>
              <span className="line-through text-xs text-gray-500">
                {formattedListPrice}
              </span>
              {discountPercent > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-50 text-red-600">
                  -{discountPercent}%
                </span>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
);

ProductPrice.displayName = "ProductPrice";

export default ProductPrice;
