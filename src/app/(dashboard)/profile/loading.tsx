import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the saved profile and contact sidebar while the session loads. */
export default function ProfileLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12" aria-label="Loading profile" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-44" />
        <Skeleton className="h-5 w-full max-w-sm" />
      </div>
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-center gap-4 border-b bg-primary/5 p-6">
            <Skeleton className="size-20 shrink-0 rounded-full sm:size-24" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-full max-w-48" />
              <Skeleton className="h-4 w-full max-w-64" />
            </div>
          </div>
          <div className="space-y-6 p-6">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-11 w-36" />
          </div>
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </main>
  );
}
