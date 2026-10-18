import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonField } from "@/features/salon/components/loading-parts";

/** Matches the shared staff create/edit form, including its bottom image pickers. */
export function StaffFormSkeleton() {
  return <Card className="gap-0 overflow-visible py-0" aria-hidden="true">
    <CardHeader className="space-y-2 border-b px-5 py-5 sm:px-8 sm:py-6"><Skeleton className="h-8 w-36" /><Skeleton className="h-4 w-28" /></CardHeader>
    <CardContent className="space-y-4 px-5 py-5 sm:px-8">
      <div className="grid gap-4 sm:grid-cols-2">{[0, 1, 2, 3].map((key) => <SkeletonField key={key} />)}</div>
      <SkeletonField /><div className="space-y-1.5"><Skeleton className="h-4 w-28" /><Skeleton className="h-20 w-full" /></div>
      <Skeleton className="h-3 w-56 max-w-full" />
      <div className="grid gap-5 sm:grid-cols-[1fr_2fr]">{[0, 1].map((key) => <div key={key} className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-28 w-full rounded-xl" /></div>)}</div>
      <Skeleton className="h-3 w-48 max-w-full" />
    </CardContent>
    <CardFooter className="flex flex-col-reverse gap-3 border-t px-5 py-4 sm:flex-row sm:justify-end sm:px-8"><Skeleton className="h-8 w-full sm:w-20" /><Skeleton className="h-8 w-full sm:w-28" /></CardFooter>
  </Card>;
}
