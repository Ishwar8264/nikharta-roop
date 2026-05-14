import { MapPin } from "lucide-react";

import { BranchCard } from "@/components/branches/branch-card";
import type { PublicBranch } from "@/features/branches/types/branch.types";

type BranchListProps = {
  branches: PublicBranch[];
};

// Public branch grid used by discovery and future booking entry points.
export function BranchList({ branches }: BranchListProps) {
  if (branches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-white/70 p-8 text-center">
        <MapPin className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          No active branches are available right now.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {branches.map((branch) => (
        <BranchCard branch={branch} key={branch.id} />
      ))}
    </div>
  );
}
