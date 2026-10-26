import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton list matching the admin verification queue layout. */
export default function AdminVerificationQueueLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="space-y-3 rounded-xl border">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="m-3 h-14 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
