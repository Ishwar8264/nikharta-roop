import { Skeleton } from "@/components/ui/skeleton";

/** Matches the staff profile banner, overlapping avatar and weekly schedule panel. */
export default function StaffDetailLoading() {
  return <div className="w-full space-y-5" role="status" aria-label="Loading staff profile" aria-busy="true">
    <Skeleton className="h-5 w-24" />
    <div className="overflow-hidden rounded-2xl border bg-card"><Skeleton className="h-36 w-full rounded-none sm:h-48" /><div className="px-4 pb-5 sm:px-6"><Skeleton className="relative -mt-8 size-20 rounded-full ring-4 ring-card sm:size-24" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div className="space-y-2"><Skeleton className="h-7 w-44 max-w-full" /><Skeleton className="h-4 w-28" /></div><div className="flex gap-2"><Skeleton className="h-7 w-20" /><Skeleton className="h-5 w-24 rounded-full" /></div></div><div className="mt-4 flex flex-wrap gap-4"><Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-44 max-w-full" /></div><Skeleton className="mt-4 h-4 w-3/4" /></div></div>
    <div className="space-y-4"><div className="grid grid-cols-3 gap-3 border-b border-border py-3">{[0, 1, 2].map((key) => <Skeleton key={key} className="mx-auto h-6 w-20 max-w-full" />)}</div><div className="space-y-3 rounded-xl border bg-card p-4"><div className="flex items-center justify-between gap-3"><Skeleton className="h-6 w-40 max-w-full" /><Skeleton className="h-8 w-28" /></div>{Array.from({ length: 7 }, (_, key) => <div key={key} className="flex items-center justify-between gap-3 border-b py-3 last:border-0"><Skeleton className="h-4 w-12" /><Skeleton className="h-4 w-28" /></div>)}</div></div>
  </div>;
}
