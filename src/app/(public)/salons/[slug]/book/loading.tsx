import { Skeleton } from "@/components/ui/skeleton";

export default function BookingLoading() {
  return <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12" role="status" aria-label="Loading booking" aria-busy="true"><div className="space-y-3"><Skeleton className="h-4 w-28" /><Skeleton className="h-9 w-56 max-w-full" /><Skeleton className="h-4 w-72 max-w-full" /></div><div className="my-6 flex gap-3 overflow-hidden">{[0, 1, 2].map((key) => <Skeleton key={key} className="h-8 w-28 shrink-0 rounded-full" />)}</div><div className="space-y-4 rounded-xl border bg-card p-4"><Skeleton className="h-6 w-36" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, key) => <div key={key} className="space-y-3 rounded-lg border p-4"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-5 w-20" /></div>)}</div><div className="flex justify-end"><Skeleton className="h-8 w-28" /></div></div></div>;
}
