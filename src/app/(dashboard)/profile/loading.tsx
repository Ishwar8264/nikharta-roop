import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the cover, profile identity, and account details while loading. */
export default function ProfileLoading() {
  return (
    <main className="w-full" aria-label="Loading profile" aria-busy="true">
      <div className="overflow-hidden rounded-2xl border bg-card">
        <Skeleton className="h-48 w-full rounded-none sm:h-64" />
        <div className="px-5 py-5 sm:px-8 sm:py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
              <Skeleton className="size-28 shrink-0 rounded-full ring-4 ring-card sm:size-36" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-7 w-full max-w-48 sm:h-8 sm:max-w-64" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-11 w-32 shrink-0" />
          </div>
        </div>
      </div>
      <div className="mt-6 space-y-3 rounded-2xl border bg-card p-5">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </main>
  );
}
