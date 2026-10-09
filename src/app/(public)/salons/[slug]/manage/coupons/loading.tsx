import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton list matching the manage coupons layout. */
export default function ManageCouponsLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div className="w-full space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-56" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="mt-8 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-16 rounded-xl" />
        ))}
      </div>
    </main>
  );
}
