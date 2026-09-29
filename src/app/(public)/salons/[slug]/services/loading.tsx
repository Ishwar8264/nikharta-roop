import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the salon service catalogue while its server data is loading. */
export default function SalonServicesLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Skeleton className="h-10 w-24" />
      <div className="mt-8 space-y-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-10 w-52" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-72 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
