import Image from "next/image";
import Link from "next/link";
import React from "react";

import { Card, CardContent, CardFooter, CardHeader } from "@components/ui/card";

import Rating from "./rating";
// import ProductPrice from './product-price'
import ImageHover from "./image-hover";
import { IProductInput } from "src/types";
// import AddToCart from './add-to-cart'

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
      <div className="relative">
         <div className="relative bg-[#F2F4F7  overflow-hidden ">
            <Image
              src={product.images[0]}
              alt={product.name}
              width={160}
              height={135}
              // fill
              // sizes='80vw'
              className="object-cover rounded-[8px] max-w-[10rem] max-h-[8rem] overflow-hidden"
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
      <span className="text-[14px] text-[#1B6013]">From ₦{product.price}</span>
    </div>
  );

   return ( <div className="flex flex-col  pb-8">
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
   )
};

export default ProductCard;
