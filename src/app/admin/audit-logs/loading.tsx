import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton matching the admin audit logs page layout. */
export default function AdminAuditLogsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-20 rounded-full" />
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
