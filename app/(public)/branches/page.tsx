/**
 * Purpose: Public branch discovery route.
 * Responsibilities: load active branches, expose route metadata, and render branch cards for customers.
 * Important notes: errors are shown inline so partial public discovery can fail gracefully.
 */
import type { Metadata } from "next";

import { BranchList } from "@/features/branches/components/branch-list";
import { listPublicBranches } from "@/features/branches/queries/branch.query";

export const metadata: Metadata = {
  title: "Branches | Nikharta Roop",
  description:
    "Find nearby Nikharta Roop beauty parlour branches for appointments and consultations.",
};

/**
 * Loads and renders public branch cards.
 */
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
