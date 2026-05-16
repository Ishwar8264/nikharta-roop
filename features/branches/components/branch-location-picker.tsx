"use client";

import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";

import { BranchLocationMap } from "@/features/branches/components/branch-location-map";
import { BranchLocationPreview } from "@/features/branches/components/branch-location-preview";
import { BranchLocationSearch } from "@/features/branches/components/branch-location-search";
import {
  getBranchLocationPoint,
  parseGooglePlace,
} from "@/features/branches/helpers/branch-location-parser";
import type { BranchLocationValue } from "@/features/branches/types/branch-location.types";

type BranchLocationPickerProps = {
  onChange: (value: BranchLocationValue) => void;
  value: BranchLocationValue;
};

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const PLACE_DETAIL_FIELDS = [
  "addressComponents",
  "displayName",
  "formattedAddress",
  "googleMapsURI",
  "id",
  "location",
];

// Top-level provider keeps Google Maps setup isolated from the branch form.
export function BranchLocationPicker(props: BranchLocationPickerProps) {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable branch location picker.
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <BranchLocationPickerContent {...props} />
    </APIProvider>
  );
}

function BranchLocationPickerContent({
  onChange,
  value,
}: BranchLocationPickerProps) {
  const places = useMapsLibrary("places");
  const selectedPoint = getBranchLocationPoint(value);

  async function handleSelectPlace(prediction: google.maps.places.PlacePrediction) {
    if (!places) return;

    const place = prediction.toPlace();

    await place.fetchFields({ fields: PLACE_DETAIL_FIELDS });

    const location = parseGooglePlace(place);

    if (location) onChange(location);
  }

  return (
    <section className="grid gap-3 rounded-xl border bg-white p-4">
      <div className="grid gap-1">
        <h3 className="text-base font-medium">Branch location</h3>
        <p className="text-sm text-muted-foreground">
          Search or click on the map to fill address and coordinates.
        </p>
      </div>
      <BranchLocationSearch onSelectPlace={handleSelectPlace} />
      <BranchLocationMap
        onChange={onChange}
        selectedPoint={selectedPoint}
        value={value}
      />
      <BranchLocationPreview value={value} />
    </section>
  );
}
