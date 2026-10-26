import { SkeletonListRows } from "@/features/salon/components/loading-parts";
import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton list matching the manage coupons layout. */
export default function ManageCouponsLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6" role="status" aria-label="Loading salon content" aria-busy="true">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-40 max-w-full" />
          <Skeleton className="h-9 w-40 max-w-full" />
          <Skeleton className="h-5 w-56 max-w-full" />
        </div>
        <Skeleton className="h-8 w-28 shrink-0" />
      </div>
      <div className="mt-8"><SkeletonListRows count={4} /></div>
    </main>
  );
}
