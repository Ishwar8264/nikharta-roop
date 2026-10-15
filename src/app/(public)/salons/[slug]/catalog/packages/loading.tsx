import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonListRows } from "@/features/salon/components/loading-parts";

export default function CatalogLoading() {
  return <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6" role="status" aria-label="Loading packages catalog" aria-busy="true"><div className="flex flex-wrap items-end justify-between gap-4"><div className="min-w-0 space-y-3"><Skeleton className="h-4 w-28" /><Skeleton className="h-9 w-52 max-w-full" /><Skeleton className="h-4 w-32" /></div><Skeleton className="h-8 w-28" /></div><SkeletonListRows /></div>;
}
