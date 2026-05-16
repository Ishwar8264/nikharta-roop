import Link from "next/link";
import { MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PublicBranch } from "@/features/branches/types/branch.types";

type AccountBranchSummaryProps = {
  branch?: PublicBranch;
};

// Shows the user's preferred branch and the next best action.
export function AccountBranchSummary({ branch }: AccountBranchSummaryProps) {
  return (
    <Card className="bg-white/85">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-rose-800" />
          <h2 className="font-heading text-lg font-semibold">Preferred branch</h2>
        </div>
        <div>
          <p className="font-medium text-stone-950">
            {branch?.nameHi ?? "No branch selected"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {branch?.address ?? "Choose a branch from your profile."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={branch ? "/account/profile/edit" : "/branches"}>
            {branch ? "Change branch" : "View branches"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
