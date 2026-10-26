import { SkeletonCatalogCard } from "@/features/salon/components/loading-parts";
import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the salon product catalogue while its server data is loading. */
export default function SalonProductsLoading() {
  return (
    <div className="min-w-0" role="status" aria-label="Loading products" aria-busy="true">
      <div className="flex flex-col gap-3 border-b border-border pb-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="w-full space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-10 w-52 max-w-full" />
          <Skeleton className="h-5 w-full max-w-xl" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row xl:shrink-0">
          <Skeleton className="h-10 w-full sm:w-40 max-w-full" />
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonCatalogCard key={index} />
        ))}
      </div>
    </div>
  );
}
