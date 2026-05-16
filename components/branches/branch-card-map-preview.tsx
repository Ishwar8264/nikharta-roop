import Image from "next/image";
import { MapPin } from "lucide-react";

import { getBranchStaticMapUrl } from "@/features/branches/helpers/branch-static-map";
import type { PublicBranch } from "@/features/branches/types/branch.types";

type BranchCardMapPreviewProps = {
  branch: PublicBranch;
};

// Static previews keep branch grids fast while still showing real locations.
export function BranchCardMapPreview({ branch }: BranchCardMapPreviewProps) {
  const mapUrl = getBranchStaticMapUrl(branch);

  if (!mapUrl) {
    return (
      <div className="grid aspect-[16/9] place-items-center bg-muted text-muted-foreground">
        <MapPin className="size-7" />
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/9] overflow-hidden bg-muted">
      <Image
        alt={`Map preview for ${branch.nameHi}`}
        className="object-cover"
        fill
        sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
        src={mapUrl}
        unoptimized
      />
    </div>
  );
}
