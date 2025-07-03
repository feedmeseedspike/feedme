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
  const optionsArr = Array.isArray(product.options) ? product.options : [];

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
      <span className="text-[14px] text-[#1B6013]">
        {optionsArr.length > 0
          ? `From ${formatNaira(Math.min(...optionsArr.map((opt) => opt.price ?? Infinity)))}`
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
          {!hideAddToCart}
        </>
      )}
    </div>
  );
};

export default React.memo(ProductCard);
