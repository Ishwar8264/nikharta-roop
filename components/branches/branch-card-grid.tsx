import type { ReactNode } from "react";
import { MapPin } from "lucide-react";

import { BranchCard } from "@/components/branches/branch-card";
import type { PublicBranch } from "@/features/branches/types/branch.types";

type BranchCardGridProps = {
  branches: PublicBranch[];
  emptyMessage: string;
  renderActions?: (branch: PublicBranch) => ReactNode;
  showStatus?: boolean;
};

// Shared responsive branch grid for public discovery and admin management views.
export function BranchCardGrid({
  branches,
  emptyMessage,
  renderActions,
  showStatus = false,
}: BranchCardGridProps) {
  if (branches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-white/70 p-8 text-center">
        <MapPin className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {branches.map((branch) => (
        <BranchCard
          actions={renderActions?.(branch)}
          branch={branch}
          key={branch.id}
          showStatus={showStatus}
        />
      ))}
    </div>
  );
}
