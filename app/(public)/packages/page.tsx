/**
 * Purpose: Public Packages route for customer package discovery.
 * Responsibilities: choose a branch, load active packages, and render package catalog UI.
 * Important notes: branch selection stays in search params for stable server rendering.
 */
import { listPublicBranches } from "@/features/branches/queries/branch.query";
import { PackageCatalog } from "@/features/packages/components/package-catalog";
import { listPublicPackages } from "@/features/packages/queries/package.query";

type PackagesPageProps = {
  searchParams: Promise<{ branchId?: string }>;
};

/**
 * Loads and renders public packages for the selected branch.
 */
export default async function PackagesPage({ searchParams }: PackagesPageProps) {
  const { branchId } = await searchParams;
  const { branches, error: branchError } = await listPublicBranches();
  const selectedBranchId = resolveSelectedBranchId(branchId, branches);
  const packageResult = selectedBranchId
    ? await listPublicPackages({ branchId: selectedBranchId, limit: 50 })
    : { error: null, packages: [] };

  return (
    <main className="bg-[#fffaf6]">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 max-w-2xl">
          <p className="text-sm font-medium text-rose-700">Packages</p>
          <h1 className="font-heading text-3xl font-semibold">
            Explore beauty packages by branch
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse active packages with bundled services, pricing, and duration.
          </p>
        </div>

        <ErrorText messages={[branchError, packageResult.error]} />
        <PackageCatalog
          branches={branches}
          packages={packageResult.packages}
          selectedBranchId={selectedBranchId}
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

  if (visibleMessages.length === 0) return null;

  return (
    <div className="mb-4 space-y-1 text-sm text-destructive">
      {visibleMessages.map((message) => (
        <p key={message}>{message}</p>
      ))}
    </div>
  );
}
