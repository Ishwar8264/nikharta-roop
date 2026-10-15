import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton matching the composer + timeline layout. */
export default function CustomerNotesLoading() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-2 h-9 w-56" />
      <Skeleton className="mt-2 h-5 w-72 max-w-full" />
      <div className="space-y-3 rounded-xl border p-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-20 w-full" />
        <div className="flex justify-end">
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
    </main>
  );
}
