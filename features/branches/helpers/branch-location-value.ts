import type { BranchLocationValue } from "@/features/branches/types/branch-location.types";
import type { BranchFormValues } from "@/features/branches/types/branch-form.types";

// Pulls location fields out of the full branch form state for the map picker.
export function getBranchLocationValue(
  values: BranchFormValues,
): BranchLocationValue {
  return {
    address: values.address,
    city: values.city,
    googleMapsUrl: values.googleMapsUrl,
    latitude: values.latitude,
    longitude: values.longitude,
    placeId: values.placeId,
  };
}
