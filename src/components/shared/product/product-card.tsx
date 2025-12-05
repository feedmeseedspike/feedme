"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useMemo } from "react";

import { IProductInput } from "src/types";
import { formatNaira } from "src/lib/utils";
import AddToCart from "@components/shared/product/add-to-cart";

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
  const optionsArr = useMemo(() => {
    if (Array.isArray(product.options)) {
      // Old format: options is array of variations
      return product.options.filter(Boolean);
    } else if (product.options && typeof product.options === "object") {
      // New format: options is object with variations and customizations
      return (product.options as any).variations || [];
    }
    return [];
  }, [product.options]);

  // Use product.id consistently to match cart items across the application
  const productId = (product as any).id || "";
  const defaultOption = optionsArr[0] || null;
  const quickAddOption = optionsArr.length <= 1 ? defaultOption : null;
  const defaultPrice =
    defaultOption?.price ??
    (typeof product.price === "number" ? product.price : 0);

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

  // Only consider out of stock if countInStock is explicitly set to a number <= 0
  const isOutOfStock =
    typeof (product as any).countInStock === "number" &&
    (product as any).countInStock <= 0;
  const isOutOfSeason = (product as any).in_season === false;

  const ProductImage = () => (
    <div className="relative h-[100px] w-[120px] md:h-[135px] md:w-[160px]">
      <Link href={`/product/${product.slug}`} className="block h-full w-full">
        <div className="relative w-full h-full bg-[#F2F4F7] overflow-hidden rounded-[8px]">
          <Image
            src={
              product.images && product.images.length > 0
                ? getImageUrl(product.images[0])
                : "/images/placeholder-banner.jpg"
            }
            alt={product.name}
            fill
            sizes="(max-width: 768px) 120px, 160px"
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      </Link>

      {!hideAddToCart && !!productId && (
        <div className="absolute bottom-1 right-1.5 md:bottom-[4px] md:right-[4px] z-10">
          <AddToCart
            minimal
            item={{
              id: productId,
              name: product.name,
              slug: product.slug,
              category:
                Array.isArray(product.category) && product.category.length > 0
                  ? product.category[0]
                  : (product as any).category_ids?.[0] || "",
              price: defaultPrice,
              images: Array.isArray(product.images)
                ? product.images.map((img: string | { url: string }) =>
                    typeof img === "string" ? img : img.url
                  )
                : [],
              countInStock: (product as any).countInStock ?? null,
              options: optionsArr as any,
              option: quickAddOption as any,
              selectedOption: quickAddOption?.name,
              in_season: (product as any).in_season ?? null,
              iconOnly: true,
              bundleId: (product as any).bundleId,
            }}
          />
        </div>
      )}
    </div>
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
        {optionsArr.length > 1
          ? `From ${formatNaira(Math.min(...optionsArr.map((opt: any) => opt.price ?? Infinity)))}`
          : optionsArr.length === 1
            ? formatNaira(optionsArr[0]?.price ?? product.price ?? 0)
            : product.price !== null && product.price !== undefined
              ? formatNaira(product.price)
              : "Price N/A"}
      </span>
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
          {/* Quick add button over image is enough per new design */}
        </>
      )}
    </div>
  );
};

export default React.memo(ProductCard);
