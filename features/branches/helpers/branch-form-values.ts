import type { BranchFormValues } from "@/features/branches/types/branch-form.types";
import type { PublicBranch } from "@/features/branches/types/branch.types";

// Builds stable defaults for create and edit branch drafts.
export function getBranchFormValues(branch?: PublicBranch): BranchFormValues {
  return {
    address: branch?.address ?? "",
    city: branch?.city ?? "",
    closeTime: branch?.closeTime.slice(0, 5) ?? "",
    googleMapsUrl: branch?.googleMapsUrl ?? "",
    isActive: branch?.isActive ?? true,
    latitude: branch?.latitude ?? "",
    longitude: branch?.longitude ?? "",
    nameEn: branch?.nameEn ?? "",
    nameHi: branch?.nameHi ?? "",
    openTime: branch?.openTime.slice(0, 5) ?? "",
    phone: branch?.phone ?? "",
    placeId: branch?.placeId ?? "",
  };
}

// Keeps stored drafts compatible when new fields are added later.
export function mergeBranchDraft(
  defaults: BranchFormValues,
  draft: Partial<BranchFormValues>,
) {
  return { ...defaults, ...draft };
}
