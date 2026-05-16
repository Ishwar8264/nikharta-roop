import type { ReactNode } from "react";
import { Clock3, MapPin, Phone } from "lucide-react";

import { BranchCardMapPreview } from "@/components/branches/branch-card-map-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PublicBranch } from "@/features/branches/types/branch.types";

type BranchCardProps = {
  actions?: ReactNode;
  branch: PublicBranch;
  showStatus?: boolean;
};

// Shared branch card; admin views compose permissions through optional props.
export function BranchCard({
  actions,
  branch,
  showStatus = false,
}: BranchCardProps) {
  return (
    <Card className="gap-0 bg-white/85 py-0">
      <BranchCardMapPreview branch={branch} />
      <CardContent className="grid gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-semibold text-stone-950">
              {branch.nameHi}
            </h2>
            <p className="truncate text-sm text-muted-foreground">
              {branch.nameEn ?? branch.city}
            </p>
          </div>
          {showStatus ? (
            <Badge variant={branch.isActive ? "secondary" : "outline"}>
              {branch.isActive ? "Active" : "Inactive"}
            </Badge>
          ) : null}
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground">
          <BranchInfo icon={<MapPin />} value={branch.address} />
          <BranchInfo icon={<Phone />} value={branch.phone} />
          <BranchInfo
            icon={<Clock3 />}
            value={`Open ${branch.openTime.slice(0, 5)} - ${branch.closeTime.slice(0, 5)}`}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {branch.googleMapsUrl ? (
            <Button asChild size="sm" variant="outline">
              <a href={branch.googleMapsUrl} rel="noreferrer" target="_blank">
                View directions
              </a>
            </Button>
          ) : null}
          {actions}
        </div>
      </CardContent>
    </Card>
  );
}

type BranchInfoProps = {
  icon: ReactNode;
  value: string;
};

// Keeps card metadata rows visually aligned without repeating icon markup.
function BranchInfo({ icon, value }: BranchInfoProps) {
  return (
    <p className="flex items-start gap-2">
      <span className="mt-0.5 [&_svg]:size-4">{icon}</span>
      <span>{value}</span>
    </p>
  );
}
