import { Skeleton } from "@/components/ui/skeleton";

/** Loading state for the dedicated profile editor. */
export default function EditProfileLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl" aria-label="Loading profile editor" aria-busy="true">
      <Skeleton className="h-11 w-36" />
      <Skeleton className="mt-4 h-10 w-48" />
      <Skeleton className="mt-3 h-5 w-full max-w-sm" />
      <Skeleton className="mt-8 h-[36rem] rounded-2xl" />
    </main>
  );
}
