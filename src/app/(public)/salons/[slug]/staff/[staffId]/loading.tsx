import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton matching the staff detail layout: header + 3-tab panel.
 *
 * The panel skeleton mimics the Tabs list + a single card body so the
 * loading state visually matches the rendered detail page before the data
 * lands. Tab content skeletons are intentionally minimal — most of the
 * perceived load is the page header and the panel chrome.
 */
export default function ManageStaffDetailLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <div className="flex items-start gap-4">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <Skeleton className="h-9 w-72 rounded-lg" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </main>
  );
}
