import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton matching the verification status banner + form layout. */
export default function ManageVerificationLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10" role="status" aria-label="Loading salon content" aria-busy="true">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-9 w-48 max-w-full" />
      <Skeleton className="mt-2 h-5 w-56 max-w-full" />

      <div className="mt-6 space-y-3 rounded-xl border bg-card p-4"><Skeleton className="h-5 w-28 rounded-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>

      <div className="mt-6 space-y-4">
        <Skeleton className="h-8 w-56 max-w-full" />
        <div className="space-y-3 rounded-xl border p-4">
          <Skeleton className="h-4 w-40 max-w-full" />
          <div className="grid gap-3 sm:grid-cols-2"><Skeleton className="h-28 w-full rounded-lg" /><Skeleton className="h-28 w-full rounded-lg" /></div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </main>
  );
}
