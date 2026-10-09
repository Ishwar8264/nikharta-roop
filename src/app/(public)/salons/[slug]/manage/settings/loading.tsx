import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton form fields matching the settings card layout. */
export default function ManageSettingsLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-9 w-72" />
      <Skeleton className="mt-2 h-5 w-96 max-w-full" />

      <div className="mt-8 space-y-6 rounded-xl ring-1 ring-foreground/10">
        <div className="space-y-5 p-4">
          <Skeleton className="h-3 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-72" />
            <div className="flex gap-3">
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>

        <div className="space-y-5 border-t p-4 pt-5">
          <Skeleton className="h-3 w-20" />
          <div className="flex items-center justify-between rounded-xl border p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>

        <div className="flex items-center justify-between border-t p-4 pt-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
      </div>
    </main>
  );
}
