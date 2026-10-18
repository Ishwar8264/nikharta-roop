import { Skeleton } from "@/components/ui/skeleton";

/** Label and input footprint shared by salon form loading states. */
export function SkeletonField() {
  return <div className="min-w-0 space-y-1.5"><Skeleton className="h-4 w-24 max-w-full" /><Skeleton className="h-8 w-full rounded-lg" /></div>;
}

/** Image, identity and pricing blocks matching public catalog cards. */
export function SkeletonCatalogCard() {
  return <div className="overflow-hidden rounded-xl border border-border bg-card">
    <Skeleton className="aspect-video w-full rounded-none" />
    <div className="space-y-3 p-4"><Skeleton className="h-4 w-20" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><div className="flex items-center justify-between gap-3 border-t pt-3"><Skeleton className="h-5 w-20" /><Skeleton className="h-8 w-24" /></div></div>
  </div>;
}

/** Structured list rows retain the identity/action rhythm instead of one large block. */
export function SkeletonListRows({ count = 4 }: { count?: number }) {
  return <div className="divide-y overflow-hidden rounded-xl border border-border bg-card">
    {Array.from({ length: count }, (_, index) => <div key={index} className="flex items-center gap-3 p-4">
      <Skeleton className="size-10 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-4 w-40 max-w-full" /><Skeleton className="h-3 w-56 max-w-full" /></div>
      <Skeleton className="hidden h-5 w-16 rounded-full sm:block" /><Skeleton className="h-8 w-16 shrink-0" />
    </div>)}
  </div>;
}

/** Placeholder for the directory sidebar while its authenticated layout resolves. */
export function SkeletonDirectoryShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 sm:py-12 md:grid-cols-[15rem_minmax(0,1fr)] lg:grid-cols-[17rem_minmax(0,1fr)]">
    <aside className="space-y-4 rounded-xl border bg-card p-3 md:self-start" aria-hidden="true"><div className="space-y-2 px-3 py-1"><Skeleton className="h-6 w-24" /><Skeleton className="h-3 w-full" /></div>{[0, 1].map((key) => <div key={key} className="flex gap-2 p-3"><Skeleton className="size-4 shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-full" /></div></div>)}</aside>
    <div className="min-w-0">{children}</div>
  </div>;
}
