import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the cover, profile identity, and account details while loading. */
export default function ProfileLoading() {
  return (
    <main className="w-full" aria-label="Loading profile" aria-busy="true">
      <div className="overflow-hidden rounded-2xl border bg-card">
        <Skeleton className="h-48 w-full rounded-none sm:h-64" />
        <div className="px-5 pb-6 sm:px-8">
          <Skeleton className="relative -mt-12 size-24 rounded-full ring-4 ring-card sm:-mt-16 sm:size-32" />
          <Skeleton className="mt-5 h-8 w-48" />
          <Skeleton className="mt-3 h-4 w-full max-w-xs" />
        </div>
      </div>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </main>
  );
}
