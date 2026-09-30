import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the service-create card while access and categories load. */
export default function CreateSalonServiceLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="rounded-xl border border-border bg-card">
        <div className="space-y-3 border-b p-6">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="space-y-8 p-6">
          <Skeleton className="h-7 w-44" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}
