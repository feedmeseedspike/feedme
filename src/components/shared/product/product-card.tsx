import Image from "next/image";
import Link from "next/link";
import React from "react";

import { IProductInput } from "src/types";
import { formatNaira } from "src/lib/utils";

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
  const ProductImage = () => (
    <Link href={`/product/${product.slug}`}>
      <div className="relative h-[100px] w-[120px] md:h-[135px] md:w-[160px]">
        <div className="relative w-full h-full bg-[#F2F4F7] overflow-hidden rounded-[8px]">
          <Image
            src={
              product.images && product.images.length > 0 && product.images[0]
                ? typeof product.images[0] === "string"
                  ? product.images[0]
                  : (() => {
                      try {
                        const parsed = JSON.parse(product.images[0]);
                        return parsed.url || "/placeholder-product.png"; // Use placeholder if URL is empty after parsing
                      } catch (e) {
                        console.error(
                          "Failed to parse image URL JSON in product-card:",
                          product.images[0],
                          e
                        );
                        return "/placeholder-product.png"; // Return placeholder on parse error
                      }
                    })()
                : "/placeholder-product.png" // Use placeholder if no images
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
    <div className="flex flex-col space-y-1">
      <Link
        href={`/product/${product.slug}`}
        className="overflow-hidden h4-bold text-ellipsis"
      >
        {product.name}
      </Link>
      <span className="text-[14px] text-[#1B6013]">
        {product.options &&
        product.options.length > 0 &&
        product.options[0]?.price !== null &&
        product.options[0]?.price !== undefined
          ? `From ${formatNaira(product.options[0].price)}`
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
          <div className="">
            <ProductDetails />
          </div>
          {
            !hideAddToCart
            // && <AddButton />
          }
        </>
      )}
    </div>
  );
};

export default React.memo(ProductCard);
