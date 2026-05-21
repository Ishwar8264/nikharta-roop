/**
 * Purpose: Public Services route for customer catalog discovery.
 * Responsibilities: choose a branch, load service categories/services, and render branch-aware catalog UI.
 * Important notes: filters stay in search params so the page can remain a Server Component.
 */
import type { Metadata } from "next";

import { ServiceCatalog } from "@/features/services/components/service-catalog";
import { listPublicBranches } from "@/features/branches/queries/branch.query";
import {
  listPublicServiceCategories,
  listPublicServices,
} from "@/features/services/queries/service.query";

type ServicesPageProps = {
  searchParams: Promise<{
    branchId?: string;
    category?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Services | Nikharta Roop",
  description:
    "Browse Nikharta Roop beauty services by branch, category, price, and duration.",
};

/**
 * Loads and renders the public service catalog for the selected branch.
 */
export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const [{ branchId, category }, { branches, error: branchError }] = await Promise.all([
    searchParams,
    listPublicBranches(),
  ]);
  const selectedBranchId = resolveSelectedBranchId(branchId, branches);

  const [categoryResult, serviceResult] = selectedBranchId
    ? await Promise.all([
        listPublicServiceCategories(selectedBranchId),
        listPublicServices({
          branchId: selectedBranchId,
          categorySlug: category,
          limit: 50,
        }),
      ])
    : [
        { categories: [], error: null },
        { error: null, services: [] },
      ];

  return (
    <main className="bg-[#fffaf6]">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 max-w-2xl">
          <p className="text-sm font-medium text-rose-700">Services</p>
          <h1 className="font-heading text-3xl font-semibold">
            Explore beauty services by branch
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse active services, prices, duration, variants, and add-ons
            before booking.
          </p>
        </div>

        <ErrorText
          messages={[
            branchError,
            categoryResult.error,
            serviceResult.error,
          ]}
        />
        <ServiceCatalog
          branches={branches}
          categories={categoryResult.categories}
          selectedBranchId={selectedBranchId}
          selectedCategorySlug={category}
          services={serviceResult.services}
        />
      </section>
    </main>
  );
}

/**
 * Picks the requested branch when valid, otherwise falls back to the first active branch.
 */
function resolveSelectedBranchId(
  requestedBranchId: string | undefined,
  branches: Array<{ id: string }>,
) {
  if (requestedBranchId && branches.some((branch) => branch.id === requestedBranchId)) {
    return requestedBranchId;
  }

  return branches[0]?.id;
}

/**
 * Renders API load errors without blocking partial catalog data.
 */
function ErrorText({ messages }: { messages: Array<string | null> }) {
  const visibleMessages = messages.filter(Boolean);

  if (visibleMessages.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 space-y-1 text-sm text-destructive">
      {visibleMessages.map((message) => (
        <p key={message}>{message}</p>
      ))}
    </div>
  );
}
