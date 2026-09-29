import { Skeleton } from "@/components/ui/skeleton";

/**
 * Streamed while page.tsx awaits the salon. Mirrors the detail layout so
 * the swap to real content does not shift the page.
 */
export default function SalonDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Cover */}
      <Skeleton className="aspect-[16/9] w-full rounded-2xl" />

      {/* Header */}
      <div className="mt-8 space-y-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-9 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-1/2 max-w-sm" />
      </div>

      {/* Grid */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        </div>

        <aside>
          <Skeleton className="h-48 w-full rounded-xl" />
        </aside>
      </div>
    </div>
  );
}
