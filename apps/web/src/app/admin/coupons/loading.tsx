import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton matching the admin coupons layout. */
export default function AdminCouponsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="space-y-3 rounded-xl border">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="m-3 h-16 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
