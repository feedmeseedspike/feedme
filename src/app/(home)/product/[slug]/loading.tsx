import { Skeleton } from "@components/ui/skeleton";
import Container from "@components/shared/Container";

export default function ProductDetailsLoading() {
  return (
    <section>
      <Container>
        <div className="py-4 grid grid-cols-1 md:grid-cols-8 gap-8 bg-white my-6 p-3">
          {/* Product Gallery Skeleton */}
          <div className="col-span-3">
            <Skeleton className="w-full aspect-square rounded-md" />
            <div className="flex gap-2 mt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-20 h-20 rounded-md" />
              ))}
            </div>
          </div>

          {/* Product Info Skeleton */}
          <div className="col-span-3">
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/4 mb-4" />
            <div className="my-4">
              <Skeleton className="h-px w-full mb-4" />
            </div>
            <Skeleton className="h-6 w-1/2 mb-2" />
            <div className="grid grid-cols-2 gap-2 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          </div>

          {/* Add to Cart Section Skeleton */}
          <div className="col-span-2 border border-[#DDD5DD] p-4 w-full h-fit">
            <Skeleton className="h-6 w-1/2 mb-4" />
            <Skeleton className="h-px w-full mb-4" />
            
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="mb-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
            
            <Skeleton className="h-px w-full mb-4" />
            <Skeleton className="h-12 w-full mb-2 rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>

        {/* Product Description Skeleton */}
        <div className="bg-white my-6 p-3">
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-20 w-full" />
        </div>

        {/* Reviews Skeleton */}
        <Skeleton className="h-px w-full mb-4" />
        <Skeleton className="h-8 w-1/4 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border p-4 rounded-md">
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/4 mb-2" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>

        {/* Related Products Skeleton */}
        <div className="mt-10">
          <Skeleton className="h-8 w-1/4 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[26rem] w-full rounded-md" />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
