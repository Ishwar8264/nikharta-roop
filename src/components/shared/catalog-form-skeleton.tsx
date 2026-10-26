import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Matches the catalogue form's sections and responsive spacing while data loads. */
export function CatalogFormSkeleton({ entity = "service" }: { entity?: "service" | "product" }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8" role="status" aria-busy="true" aria-label={`Loading ${entity} form`}>
      <span className="sr-only">Loading {entity} form…</span>
      <Card className="gap-0 overflow-visible py-0" aria-hidden="true">
        <CardHeader className="border-b px-5 py-5 sm:px-8 sm:py-6">
          <div className="space-y-1">
            <Skeleton className="h-8 w-56 max-w-full sm:h-9" />
            <Skeleton className="h-5 w-full max-w-lg" />
          </div>
        </CardHeader>

        <CardContent className="space-y-8 px-5 py-6 sm:space-y-10 sm:px-8">
          <div className="space-y-4">
            <SectionHeading />
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
            <div className="grid items-start gap-4 sm:grid-cols-3">
              <FieldSkeleton />
              <div className="space-y-1.5 sm:col-span-2">
                <FieldSkeleton />
                <Skeleton className="ml-auto h-4 w-28" />
              </div>
            </div>
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <div className="overflow-hidden rounded-md border border-border">
                <div className="flex h-12 gap-2 border-b border-border p-2">
                  {[0, 1, 2, 3, 4].map((item) => <Skeleton key={item} className="size-8" />)}
                </div>
                <Skeleton className="h-30 w-full rounded-none" />
              </div>
              <Skeleton className="ml-auto h-4 w-28" />
            </div>
            <Skeleton className="h-4 w-full max-w-sm" />
          </div>

          <div className="space-y-4">
            <SectionHeading />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {["cover", "banner"].map((image) => (
                <div key={image} className="min-w-0 space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="aspect-[21/9] min-h-36 w-full min-w-0 rounded-md" />
                  <Skeleton className="h-4 w-full max-w-56" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <SectionHeading />
            <Skeleton className="min-h-44 w-full rounded-md" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-44" />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col-reverse items-stretch gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-8">
          <Skeleton className="h-10 w-full rounded-lg sm:w-28" />
          <Skeleton className="h-10 w-full rounded-lg sm:w-32" />
        </CardFooter>
      </Card>
    </div>
  );
}

function SectionHeading() {
  return <div className="border-b border-border pb-3"><Skeleton className="h-6 w-44" /></div>;
}

function FieldSkeleton() {
  return <div className="space-y-1.5"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-full rounded-lg" /></div>;
}
