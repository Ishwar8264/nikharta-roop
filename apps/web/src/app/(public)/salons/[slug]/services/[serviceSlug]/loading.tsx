import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the public service detail layout while its data is loading. */
export default function SalonServiceDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12" role="status" aria-label="Loading salon content" aria-busy="true">
      <Skeleton className="h-10 w-24" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
        <div className="space-y-8">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <div className="space-y-3">
            <Skeleton className="h-7 w-48 max-w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </div>
        </div>
        <div className="space-y-4 rounded-2xl border bg-card p-5"><Skeleton className="h-5 w-20 rounded-full" /><Skeleton className="h-9 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /><div className="grid grid-cols-2 gap-3 border-y py-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div><Skeleton className="h-10 w-full" /></div>
      </div>
    </div>
  );
}
