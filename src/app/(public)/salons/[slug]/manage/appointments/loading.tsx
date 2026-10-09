import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton list matching the manage-appointments layout: header + filter
 * chip row + 6 appointment rows (the typical page-1 length) so the loading
 * state visually matches the rendered output before the data lands.
 */
export default function ManageAppointmentsLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Filter chip row */}
      <div className="mt-6 flex flex-wrap gap-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      {/* Row list — mobile cards stack on small, table on lg */}
      <div className="mt-6 space-y-3 lg:hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="hidden lg:block">
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </main>
  );
}
