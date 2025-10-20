import Image from "next/image";
import Link from "next/link";
import React from "react";

import { IProductInput } from "src/types";
import { formatNaira } from "src/lib/utils";

interface ImageJSON {
  url: string;
}

const ProductCard = ({
  product,
  hideBorder = false,
  hideDetails = false,
  hideAddToCart = false,
}: {
  product: IProductInput;
  hideDetails?: boolean;
  hideBorder?: boolean;
  hideAddToCart?: boolean;
}) => {
  // console.log(product);
  // Handle both old array format and new object format for options
  const optionsArr = (() => {
    if (Array.isArray(product.options)) {
      // Old format: options is array of variations
      return product.options.filter(Boolean);
    } else if (product.options && typeof product.options === "object") {
      // New format: options is object with variations and customizations
      return (product.options as any).variations || [];
    }
    return [];
  })();

  const getImageUrl = (imageData: string | ImageJSON): string => {
    if (typeof imageData === "string") {
      try {
        const parsed = JSON.parse(imageData) as ImageJSON;
        return parsed.url || "/images/placeholder-banner.jpg";
      } catch {
        // If it's a string but not JSON, assume it's a direct URL
        return imageData;
      }
    }
    // If it's already an object (ImageJSON), use its URL
    return imageData.url || "/images/placeholder-banner.jpg";
  };

  const ProductImage = () => (
    <Link href={`/product/${product.slug}`}>
      <div className="relative h-[100px] w-[120px] md:h-[135px] md:w-[160px]">
        <div className="relative w-full h-full bg-[#F2F4F7] overflow-hidden rounded-[8px]">
          <Image
            src={
              product.images && product.images.length > 0
                ? getImageUrl(product.images[0])
                : "/images/placeholder-banner.jpg"
            }
            alt={product.name}
            fill
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </Link>
  );
  const ProductDetails = () => (
    <div className="flex flex-col space-y-1 w-[120px] md:w-[160px]">
      <Link
        href={`/product/${product.slug}`}
        className="overflow-hidden h4-bold text-ellipsis leading-5 max-w-[10rem]"
      >
        {product.name}
      </Link>
      {product.in_season === true && (
        <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded font-semibold w-fit">
          In Season
        </span>
      )}
      {product.in_season === false && (
        <span className="inline-block mt-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded font-semibold w-fit">
          Out of Season
        </span>
      )}
      <span className="text-[14px] text-[#1B6013]">
        {optionsArr.length > 0
          ? `From ${formatNaira(Math.min(...optionsArr.map((opt: any) => opt.price ?? Infinity)))}`
          : product.price !== null && product.price !== undefined
            ? formatNaira(product.price)
            : "Price N/A"}
      </span>
      {/* Discount / list price under main price */}
      {(() => {
        if (optionsArr.length > 0) {
          const minList = Math.min(
            ...optionsArr.map((opt: any) =>
              typeof opt.list_price === "number"
                ? opt.list_price
                : (opt.price ?? Infinity)
            )
          );
          const minPrice = Math.min(
            ...optionsArr.map((opt: any) => opt.price ?? Infinity)
          );
          const discounts = optionsArr
            .map((opt: any) => {
              const lp =
                typeof opt.list_price === "number" ? opt.list_price : 0;
              const p = opt.price ?? 0;
              if (lp > p && p > 0) return Math.round(100 - (p / lp) * 100);
              return 0;
            })
            .filter((d: number) => d > 0);
          const maxDiscount = discounts.length > 0 ? Math.max(...discounts) : 0;
          if (minList > minPrice || maxDiscount > 0) {
            return (
              <div className="mt-0.5 flex items-center gap-1">
                {minList > minPrice && (
                  <span className="text-[12px] text-gray-500 line-through">
                    From {formatNaira(minList)}
                  </span>
                )}
                {maxDiscount > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-50 text-red-600">
                    Up to -{maxDiscount}%
                  </span>
                )}
              </div>
            );
          }
          return null;
        }
        // No variations: use base product list_price if available
        const basePrice = product.price ?? 0;
        const baseList = (product as any).list_price as number | undefined;
        if (
          typeof baseList === "number" &&
          baseList > basePrice &&
          basePrice > 0
        ) {
          const discount = Math.round(100 - (basePrice / baseList) * 100);
          return (
            <div className="mt-0.5 flex items-center gap-1">
              <span className="text-[12px] text-gray-500 line-through">
                {formatNaira(baseList)}
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-50 text-red-600">
                -{discount}%
              </span>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );

  return (
    <div className="flex flex-col mb-4 md:pb-8 gap-2">
      <ProductImage />
      {!hideDetails && (
        <>
          <div>
            <ProductDetails />
          </div>
          {!hideAddToCart}
        </>
      )}
    </div>
  );
};

export default React.memo(ProductCard);
