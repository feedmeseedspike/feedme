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
    <div className="relative h-[15rem] w-full overflow-hidden rounded-lg">
      <Skeleton className="h-full w-full" />
    </div>
  );

  const DetailsSkeleton = () => (
    <div className="flex-1 space-y-2">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2 items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-10" />
      </div>
      <Skeleton className="h-6 w-1/2" />
    </div>
  );

  const ButtonSkeleton = () => (
    <div className="w-full">
      <Skeleton className="h-10 w-full" />
    </div>
  );

  return hideBorder ? (
    <div className="flex flex-col">
      <ImageSkeleton />
      {!hideDetails && (
        <>
          <div className="p-2 flex-1 text-center">
            <DetailsSkeleton />
          </div>
          {!hideAddToCart && <ButtonSkeleton />}
        </>
      )}
    </div>
  ) : (
    <Card className="flex flex-col">
      <CardHeader className="p-2">
        <ImageSkeleton />
      </CardHeader>
      {!hideDetails && (
        <>
          <CardContent className="pt-2 pb-0 flex-1 gap-2">
            <DetailsSkeleton />
          </CardContent>
          <CardFooter className="p-2">
            {!hideAddToCart && <ButtonSkeleton />}
          </CardFooter>
        </>
      )}
    </Card>
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
