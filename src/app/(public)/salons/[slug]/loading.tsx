import { Skeleton } from "@/components/ui/skeleton";

/**
 * Streamed while page.tsx awaits the salon. Mirrors the detail layout so
 * the swap to real content does not shift the page.
 */
export default function SalonDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-2 py-2" role="status" aria-label="Loading salon content" aria-busy="true">
      <Skeleton className="h-8 w-20" />
      {/* Cover */}
      <Skeleton className="aspect-[21/9] w-full rounded-md" />

      {/* Header */}
      <div className="mt-8 space-y-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-9 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-1/2 max-w-sm" />
      </div>

      <div className="flex gap-3 overflow-hidden border-y py-2">{[0, 1, 2, 3].map((key) => <Skeleton key={key} className="h-9 w-24 shrink-0" />)}</div>
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
            <Skeleton className="h-6 w-28" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>

          <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <div className="space-y-4 rounded-xl border bg-card p-5"><Skeleton className="h-5 w-32" />{Array.from({ length: 7 }, (_, key) => <div key={key} className="flex justify-between gap-3"><Skeleton className="h-4 w-12" /><Skeleton className="h-4 w-24" /></div>)}</div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="space-y-4 rounded-xl border bg-card p-5"><Skeleton className="h-5 w-32" />{Array.from({ length: 7 }, (_, key) => <div key={key} className="flex justify-between gap-3"><Skeleton className="h-4 w-12" /><Skeleton className="h-4 w-24" /></div>)}</div>
          <div className="space-y-4 rounded-xl border bg-card p-5"><Skeleton className="h-5 w-24" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </aside>
      </div>
    </div>
  );
}
