import { BranchCardGrid } from "@/components/branches/branch-card-grid";
import type { PublicBranch } from "@/features/branches/types/branch.types";

type BranchListProps = {
  branches: PublicBranch[];
};

// Public branch grid used by discovery and future booking entry points.
export function BranchList({ branches }: BranchListProps) {
  return (
    <BranchCardGrid
      branches={branches}
      emptyMessage="No active branches are available right now."
    />
  );
}
