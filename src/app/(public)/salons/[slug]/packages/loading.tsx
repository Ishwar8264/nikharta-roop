import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton grid matching the public package card layout. */
export default function SalonPackagesLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Skeleton className="h-9 w-24" />
      <Skeleton className="mt-8 h-5 w-40" />
      <Skeleton className="mt-2 h-9 w-72" />
      <Skeleton className="mt-2 h-5 w-96 max-w-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-64 rounded-xl" />
        ))}
      </div>
    </main>
  );
}
