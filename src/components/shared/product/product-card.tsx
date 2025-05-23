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
  const ProductImage = () => (
    <Link href={`/product/${product.slug}`}>
      <div className="relative h-[100px] w-[120px] md:h-[135px] md:w-[160px]">
        <div className="relative w-full h-full bg-[#F2F4F7] overflow-hidden rounded-[8px]">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
      </div>
    </Link>
  );
  const ProductDetails = () => (
    <div className="flex flex-col space-y-">
      <Link
        href={`/product/${product.slug}`}
        className="overflow-hidden h4-bold text-ellipsis"
      >
        {product.name}
      </Link>
      <span className="text-[14px] text-[#1B6013]">
        From {formatNaira(product.options[0].price) || product.price}{" "}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col mb-4 md:pb-8">
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
