import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the compact package form for both creation and editing. */
export function PackageFormSkeleton() {
  return <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8" role="status" aria-label="Loading package form">
    <div className="overflow-hidden rounded-xl border bg-card" aria-hidden="true">
      <div className="space-y-2 border-b px-5 py-5 sm:px-8 sm:py-6"><Skeleton className="h-9 w-52" /><Skeleton className="h-5 w-full" /></div>
      <div className="space-y-6 px-5 py-6 sm:px-8"><Skeleton className="h-7 w-44" /><div className="grid gap-4 sm:grid-cols-2">{[0, 1, 2, 3].map((field) => <div key={field} className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-11 w-full rounded-md" /></div>)}</div><Skeleton className="h-7 w-44" /><Skeleton className="h-4 w-64 max-w-full" /><Skeleton className="h-11 w-full rounded-md" /></div>
      <div className="flex justify-end gap-3 border-t px-5 py-4 sm:px-8"><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-32" /></div>
    </div>
  </div>;
}
