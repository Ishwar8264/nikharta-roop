import type { BranchFormValues } from "@/features/branches/types/branch-form.types";

export type BranchLocationValue = Pick<
  BranchFormValues,
  "address" | "city" | "googleMapsUrl" | "latitude" | "longitude" | "placeId"
>;

export type BranchMapPoint = {
  lat: number;
  lng: number;
};
