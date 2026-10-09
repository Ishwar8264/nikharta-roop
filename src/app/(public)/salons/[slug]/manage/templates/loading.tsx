import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton grid matching the activation card layout. */
export default function ManageTemplatesLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-9 w-72" />
      <Skeleton className="mt-2 h-5 w-96 max-w-full" />
      <div className="mt-8 flex gap-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 flex-1 sm:w-64" />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-xl" />
        ))}
      </div>
    </main>
  );
}
