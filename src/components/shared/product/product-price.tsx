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

    if (listPrice === 0 || listPrice <= price) {
      return <div className={cn("text-[14px] font-bold text-[#1B6013]", className)}>{formattedPrice}</div>;
    }

    if (isDeal) {
      return (
        <div className="space-y-2">
          <div className={`flex ${forListing && ""} flex-col items-start gap-1`}>
            <div className={cn("text-[14px] font-bold text-[#1B6013]", className)}>{formattedPrice}</div>
            <div className="text-gray-400 text-xs font-semibold">
              Was: <span className="line-through">{formattedListPrice}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="flex gap-1.5 items-center flex-wrap">
          <div className={cn("text-[14px] font-bold text-[#1B6013]", className)}>{formattedPrice}</div>
          <span className="line-through text-[10px] font-semibold text-gray-400">{formattedListPrice}</span>
        </div>
      </div>
    );
  }
);

ProductPrice.displayName = "ProductPrice";

export default ProductPrice;
