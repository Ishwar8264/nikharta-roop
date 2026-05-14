import { BranchList } from "@/features/branches/components/branch-list";
import { listPublicBranches } from "@/features/branches/queries/branch.query";

export default async function BranchesPage() {
  const { branches, error } = await listPublicBranches();

  return (
    <main className="bg-[#fffaf6]">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 max-w-2xl">
          <p className="text-sm font-medium text-rose-700">Branches</p>
          <h1 className="font-heading text-3xl font-semibold">
            Find your nearest Nikharta Roop parlour
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a nearby location for appointments and consultations.
          </p>
        </div>

        {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
        <BranchList branches={branches} />
      </section>
    </main>
  );
}
