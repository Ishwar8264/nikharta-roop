import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton layout matching the settings page. */
export default function SettingsLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="mt-8 space-y-6">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </main>
  );
}
