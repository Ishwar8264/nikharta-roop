import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonField, SkeletonListRows } from "@/features/salon/components/loading-parts";

export default function SalonEditLoading() {
  return <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6" role="status" aria-label="Loading salon editor" aria-busy="true"><Skeleton className="mt-4 h-9 w-56 max-w-full" /><div className="space-y-5 rounded-xl border p-6"><Skeleton className="h-6 w-32" /><div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 12 }, (_, key) => <SkeletonField key={key} />)}</div><SkeletonField /><Skeleton className="h-8 w-28" /></div><SkeletonListRows count={3} /></div>;
}
