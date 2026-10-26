import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton matching the admin AI usage page layout. */
export default function AdminAiUsageLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="space-y-3 rounded-xl border">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="m-3 h-12 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
