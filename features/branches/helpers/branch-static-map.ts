import type { PublicBranch } from "@/features/branches/types/branch.types";

const STATIC_MAP_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const STATIC_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

// Builds a Google Static Maps URL only when the branch has usable coordinates.
export function getBranchStaticMapUrl(branch: PublicBranch) {
  if (!STATIC_MAP_API_KEY || !branch.latitude || !branch.longitude) return null;

  const point = `${branch.latitude},${branch.longitude}`;
  const params = new URLSearchParams({
    center: point,
    key: STATIC_MAP_API_KEY,
    markers: `color:0x9f1239|${point}`,
    scale: "2",
    size: "640x360",
    zoom: "15",
  });

  if (STATIC_MAP_ID) params.set("map_id", STATIC_MAP_ID);

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}
