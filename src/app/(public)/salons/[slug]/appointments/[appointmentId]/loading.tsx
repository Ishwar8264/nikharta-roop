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
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Skeleton className="h-4 w-28" />

      {/* Header: avatar + name + date */}
      <div className="mt-6 flex items-start gap-4">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>

      {/* Status + transitions card */}
      <div className="mt-8 space-y-4">
        <Skeleton className="h-16 rounded-xl" />
        {/* Customer card */}
        <Skeleton className="h-28 rounded-xl" />
        {/* Services + totals card */}
        <Skeleton className="h-56 rounded-xl" />
        {/* Payments ledger */}
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </main>
  );
}
