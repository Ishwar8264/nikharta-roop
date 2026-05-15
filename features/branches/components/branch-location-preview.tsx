import { MapPin } from "lucide-react";

import type { BranchLocationValue } from "@/features/branches/types/branch-location.types";

type BranchLocationPreviewProps = {
  value: BranchLocationValue;
};

// Small confirmation panel for the selected Google Maps location.
export function BranchLocationPreview({ value }: BranchLocationPreviewProps) {
  const hasLocation = Boolean(value.latitude && value.longitude);

  if (!hasLocation) {
    return (
      <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        Select a branch location from the map to fill address and coordinates.
      </p>
    );
  }

  return (
    <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="font-medium">{value.address || "Selected location"}</p>
          <p className="text-muted-foreground">{value.city || "City not detected"}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {value.latitude}, {value.longitude}
      </p>
    </div>
  );
}
