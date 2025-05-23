import { Skeleton } from "@components/ui/skeleton";

export default function ProductSliderSkeleton() {
  return (
    <div className="mb-12">
      <Skeleton className="h-8 w-64 mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[300px] w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}
