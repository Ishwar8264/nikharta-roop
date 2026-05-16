import Link from "next/link";

import { BranchCardGrid } from "@/components/branches/branch-card-grid";
import { Button } from "@/components/ui/button";
import type { PublicBranch } from "@/features/branches/types/branch.types";

type AdminBranchListProps = {
  branches: PublicBranch[];
};

// Admin branch overview backed by the branch management API.
export function AdminBranchList({ branches }: AdminBranchListProps) {
  return (
    <BranchCardGrid
      branches={branches}
      emptyMessage="No branches are available for your admin scope."
      renderActions={(branch) => (
        <Button asChild key={branch.id} size="sm">
          <Link href={`/admin/branches/${branch.id}/edit`}>Edit</Link>
        </Button>
      )}
      showStatus
    />
  );
}
