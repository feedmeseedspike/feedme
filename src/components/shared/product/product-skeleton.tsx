'use client';

import React from 'react';
import { Skeleton } from '@components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@components/ui/card';

export const ProductCardSkeleton = ({
  hideBorder = false,
  hideDetails = false,
  hideAddToCart = false,
}: {
  hideDetails?: boolean;
  hideBorder?: boolean;
  hideAddToCart?: boolean;
}) => {
  const ImageSkeleton = () => (
    <div className="relative h-[10rem] lg:h-[12rem] w-full overflow-hidden rounded-lg">
      <Skeleton className="h-full w-full" />
      {/* Like button skeleton */}
      <Skeleton className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full" />
      {/* Add to cart button skeleton */}
      <Skeleton className="absolute bottom-2 right-2 z-10 h-8 w-8 rounded-full" />
    </div>
  );

  const DetailsSkeleton = () => (
    <div className="flex-1 space-y-2">
      {/* Product name */}
      <Skeleton className="h-6 w-full" />
      {/* Rating */}
      <div className="flex gap-2">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-4" />
          ))}
        </div>
        <Skeleton className="h-4 w-10" />
      </div>
      {/* Price */}
      <Skeleton className="h-6 w-24" />
    </div>
  );

  const OptionsDropdownSkeleton = () => (
    <div className="w-[8rem] mt-2">
      <Skeleton className="h-10 w-full" />
    </div>
  );

  return hideBorder ? (
    <div className="flex flex-col">
      <ImageSkeleton />
      {!hideDetails && (
        <div className="p-2 flex-1">
          <DetailsSkeleton />
          <OptionsDropdownSkeleton />
        </div>
      )}
    </div>
  ) : (
    <div className="rounded-[8px] border p-2">
      <ImageSkeleton />
      {!hideDetails && (
        <div className="pt-2 pb-0 flex-1 gap-2">
          <DetailsSkeleton />
          <OptionsDropdownSkeleton />
        </div>
      )}
    </div>
  );
};

export const ProductSkeletonGrid = ({ count = 8 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

export default ProductCardSkeleton;