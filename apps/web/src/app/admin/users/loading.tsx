import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton matching the admin users table layout. */
export default function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="space-y-3 rounded-xl border">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="m-3 h-16 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
