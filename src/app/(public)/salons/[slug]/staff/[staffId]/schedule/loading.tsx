import { Skeleton } from "@/components/ui/skeleton";

/** Matches the compact editor header, weekly rows and separate action footer. */
export default function ScheduleLoading() {
  return <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-xl border bg-card" role="status" aria-label="Loading schedule editor" aria-busy="true">
    <div className="space-y-3 border-b px-4 py-4 sm:px-6"><Skeleton className="h-7 w-16" /><Skeleton className="h-6 w-40" /><Skeleton className="h-3 w-56 max-w-full" /></div>
    <div className="divide-y px-4 py-3 sm:px-6">{Array.from({ length: 7 }, (_, key) => <div key={key} className="grid grid-cols-[3rem_4rem_minmax(0,1fr)] items-center gap-3 py-3"><Skeleton className="h-4 w-10" /><Skeleton className="h-5 w-10 rounded-full" /><Skeleton className="h-4 w-20 max-w-full" /></div>)}</div>
    <div className="flex justify-end gap-2 border-t px-4 py-4 sm:px-6"><Skeleton className="h-8 w-20" /><Skeleton className="h-8 w-28" /></div>
  </div>;
}
