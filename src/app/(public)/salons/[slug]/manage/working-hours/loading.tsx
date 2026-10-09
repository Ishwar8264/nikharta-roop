import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton form rows matching the weekly editor layout. */
export default function ManageWorkingHoursLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-9 w-72" />
      <Skeleton className="mt-2 h-5 w-96 max-w-full" />

      <div className="mt-8 space-y-3 rounded-xl ring-1 ring-foreground/10">
        <div className="space-y-4 p-4">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3"
            >
              <Skeleton className="h-4 w-24" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t p-4 pt-5">
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </main>
  );
}
