import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the salon service catalogue while its server data is loading. */
export default function SalonServicesLoading() {
  return (
    <div className="min-w-0" aria-label="Loading services" aria-busy="true">
      <div className="flex flex-col gap-3 border-b border-border pb-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="w-full space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-10 w-52" />
          <Skeleton className="h-5 w-full max-w-xl" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row xl:shrink-0">
          <Skeleton className="h-10 w-full sm:w-40" />
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-72 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
