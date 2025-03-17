'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import { Card, CardContent, CardFooter, CardHeader } from '@components/ui/card';

import Rating from './rating';
import { generateId, formatNaira } from '../../../lib/utils';
import ImageHover from './image-hover';
import AddToCart from './add-to-cart';
import { IProductInput } from 'src/types';
import ProductPrice from '@components/shared/product/product-price';
import { addItem } from 'src/store/features/cartSlice';
import { useDispatch } from 'react-redux';

const ProductdetailsCard = ({
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
  const dispatch = useDispatch();

  const ProductImage = () => {
    const discountPercent = Math.round(
      100 - (product.price / product.listPrice) * 100
    );

    return (
      <Link href={`/product/${product.slug}`}>
        <div className="relative h-[15rem] w-full overflow-hidden rounded-lg">
          {/* Discount Badge */}
          {product.listPrice > 0 && product.listPrice > product.price && (
            <div className="absolute top-2 right-2 bg-red-600 rounded-full px-3 py-1 text-white text-xs font-semibold z-10">
              {discountPercent}% Off
            </div>
          )}

          {product.images.length > 1 ? (
            <ImageHover
              src={product.images[0]}
              hoverSrc={product.images[1]}
              alt={product.name}
            />
          ) : (
            <div className="relative w-full h-full">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 ease-in-out hover:scale-105"
                priority
              />
            </div>
          )}
        </div>
      </Link>
    );
  };

  const ProductDetails = () => (
    <div className="flex-1">
      <Link
        href={`/product/${product.slug}`}
        className="overflow-hidden text-ellipsis h4-bold"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {product.name}
      </Link>
      <div className="flex gap-2">
        <Rating rating={product.avgRating} />
        <span className="text-gray-600 text-sm">({product.numReviews})</span>
      </div>

      <ProductPrice
        isDeal={product.tags.includes('todays-deal')}
        price={product.price}
        listPrice={product.listPrice}
        forListing
      />
    </div>
  );

  const AddButton = () => (
    <div className="w-full text-center">
      <AddToCart
        minimal
        className="!bg-white !text-[#1B6013] hover:!bg-[#1B6013] hover:!text-black transition-all ease-in-out border border-[#DDD5DD]"
        item={{
          clientId: generateId(),
          product: product._id,
          color: product.colors[0],
          countInStock: product.countInStock,
          name: product.name,
          slug: product.slug,
          category: product.category,
          price: product.price,
          quantity: 1,
          image: product.images[0],
        }}
      />
    </div>
  );

  return hideBorder ? (
    <div className="flex flex-col">
      <ProductImage />
      {!hideDetails && (
        <>
          <div className="p-2 flex-1 text-center">
            <ProductDetails />
          </div>
          {!hideAddToCart && <AddButton />}
        </>
      )}
    </div>
  ) : (
    <Card className="flex flex-col">
      <CardHeader className="p-2">
        <ProductImage />
      </CardHeader>
      {!hideDetails && (
        <>
          <CardContent className="pt-2 pb-0  flex-1 gap-2">
            <ProductDetails />
          </CardContent>
          <CardFooter className="p-2">
            {!hideAddToCart && <AddButton />}
          </CardFooter>
        </>
      )}
    </Card>
  );
};

export default ProductdetailsCard;