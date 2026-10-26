import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton layout matching the salon-side appointment detail page: back link,
 * header (avatar + name + date), status row, customer card, services card,
 * payments ledger, and a notes placeholder. Each block matches a real
 * section so the loading state visually fills the same footprint before the
 * data lands.
 */
export default function ManageSalonAppointmentDetailLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6" role="status" aria-label="Loading salon content" aria-busy="true">
      <Skeleton className="h-4 w-28" />

      {/* Header: avatar + name + date */}
      <div className="mt-6 flex items-start gap-4">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-48 max-w-full" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </div>
      </div>

      {/* Status + transitions card */}
      <div className="mt-8 space-y-4">
        <div className="space-y-4 rounded-xl border bg-card p-5"><Skeleton className="h-5 w-32 max-w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /><div className="flex justify-between gap-3 border-t pt-3"><Skeleton className="h-4 w-20" /><Skeleton className="h-8 w-24" /></div></div>
        {/* Customer card */}
        <div className="space-y-4 rounded-xl border bg-card p-5"><Skeleton className="h-5 w-32 max-w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /><div className="flex justify-between gap-3 border-t pt-3"><Skeleton className="h-4 w-20" /><Skeleton className="h-8 w-24" /></div></div>
        {/* Services + totals card */}
        <div className="space-y-4 rounded-xl border bg-card p-5"><Skeleton className="h-5 w-32 max-w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /><div className="flex justify-between gap-3 border-t pt-3"><Skeleton className="h-4 w-20" /><Skeleton className="h-8 w-24" /></div></div>
        {/* Payments ledger */}
        <div className="space-y-4 rounded-xl border bg-card p-5"><Skeleton className="h-5 w-32 max-w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /><div className="flex justify-between gap-3 border-t pt-3"><Skeleton className="h-4 w-20" /><Skeleton className="h-8 w-24" /></div></div>
      </div>
    </main>
  );
}
