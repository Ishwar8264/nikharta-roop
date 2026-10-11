import { Skeleton } from "@/components/ui/skeleton";

export default function PackageDetailLoading() {
  return <div className="space-y-6" aria-label="Loading package details" aria-busy="true"><div className="space-y-3"><Skeleton className="h-4 w-32" /><Skeleton className="h-9 w-64" /><Skeleton className="h-4 w-40" /></div><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"><Skeleton className="h-60 w-full rounded-xl" /><Skeleton className="h-48 w-full rounded-xl" /></div></div>;
}
