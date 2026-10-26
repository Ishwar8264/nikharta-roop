import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonCatalogCard, SkeletonDirectoryShell } from "@/features/salon/components/loading-parts";

export default function SalonDirectoryLoading() {
  return <div role="status" aria-label="Loading salons" aria-busy="true"><SkeletonDirectoryShell><div className="space-y-5"><div className="space-y-3 rounded-2xl border px-5 py-8 sm:px-10 sm:py-12"><Skeleton className="h-6 w-44 max-w-full rounded-full" /><Skeleton className="h-10 w-72 max-w-full" /><Skeleton className="h-4 w-full max-w-lg" /><Skeleton className="h-4 w-3/4 max-w-md" /></div><div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row"><Skeleton className="h-9 flex-1" /><Skeleton className="h-9 w-full sm:w-36" /><Skeleton className="h-9 w-full sm:w-28" /></div><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, key) => <SkeletonCatalogCard key={key} />)}</div></div></SkeletonDirectoryShell></div>;
}
