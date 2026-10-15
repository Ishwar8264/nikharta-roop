import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton matching the verification status banner + form layout. */
export default function ManageVerificationLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-9 w-48" />
      <Skeleton className="mt-2 h-5 w-56" />

      <Skeleton className="mt-6 h-20 rounded-xl" />

      <div className="mt-6 space-y-4">
        <Skeleton className="h-8 w-56" />
        <div className="space-y-3 rounded-xl border p-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </main>
  );
}
