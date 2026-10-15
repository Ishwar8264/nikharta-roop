import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return <div className="min-w-0" role="status" aria-label="Loading product details" aria-busy="true"><div className="grid gap-8 lg:grid-cols-2"><div className="space-y-4"><Skeleton className="aspect-video w-full rounded-2xl" /><div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((key) => <Skeleton key={key} className="aspect-square w-full rounded-xl" />)}</div></div><div className="space-y-5"><Skeleton className="h-5 w-24 rounded-full" /><Skeleton className="h-9 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-7 w-28" /><div className="flex gap-3"><Skeleton className="h-10 w-36" /><Skeleton className="size-10" /></div><div className="space-y-3 border-t pt-5"><Skeleton className="h-5 w-28" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div></div></div></div>;
}
