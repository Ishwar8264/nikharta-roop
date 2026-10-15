import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton list matching the manage-staff layout: header + table.
 *
 * Why a single table-sized skeleton (not 8 row skeletons):
 * The table is the dominant visual block on desktop; one skeleton with the
 * table's approximate height reads as "loading" without the per-row
 * shimmer that would feel busy. On mobile, we stack 5 card skeletons to
 * match the card layout's rhythm.
 */
export default function ManageStaffLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-5 w-48" />
      </div>

      {/* Mobile cards */}
      <div className="mt-6 space-y-3 lg:hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block">
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </main>
  );
}
