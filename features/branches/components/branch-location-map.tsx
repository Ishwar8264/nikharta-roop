"use client";

import * as React from "react";
import {
  AdvancedMarker,
  Map,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";

import {
  getBranchLocationPoint,
  parseGoogleGeocoderResult,
} from "@/features/branches/helpers/branch-location-parser";
import type {
  BranchLocationValue,
  BranchMapPoint,
} from "@/features/branches/types/branch-location.types";

type BranchLocationMapProps = {
  onChange: (value: BranchLocationValue) => void;
  selectedPoint: BranchMapPoint | null;
  value: BranchLocationValue;
};

type MapClickEvent = {
  detail: {
    latLng: BranchMapPoint | null;
  };
};

const DEFAULT_CENTER = { lat: 28.4595, lng: 77.0266 };
const GOOGLE_MAPS_MAP_ID =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID";

// Displays the selectable Google Map and reverse-geocodes clicked locations.
export function BranchLocationMap({
  onChange,
  selectedPoint,
  value,
}: BranchLocationMapProps) {
  const geocoding = useMapsLibrary("geocoding");
  const geocoder = React.useMemo(
    () => geocoding && new geocoding.Geocoder(),
    [geocoding],
  );
  const center = selectedPoint ?? getBranchLocationPoint(value) ?? DEFAULT_CENTER;

  async function handlePointSelect(point: BranchMapPoint | null) {
    if (!point || !geocoder) return;

    const response = await geocoder.geocode({ location: point });
    const result = response.results[0];
    const location = result ? parseGoogleGeocoderResult(result) : null;

    if (location) onChange(location);
  }

  function handleMarkerDragEnd(event: google.maps.MapMouseEvent) {
    const location = event.latLng;

    handlePointSelect(location ? { lat: location.lat(), lng: location.lng() } : null);
  }

  return (
    <div className="h-72 overflow-hidden rounded-lg border bg-muted">
      <Map
        center={center}
        defaultZoom={14}
        gestureHandling="greedy"
        mapId={GOOGLE_MAPS_MAP_ID}
        mapTypeControl={false}
        onClick={(event: MapClickEvent) => handlePointSelect(event.detail.latLng)}
        streetViewControl={false}
      >
        {center ? (
          <AdvancedMarker
            draggable
            onDragEnd={handleMarkerDragEnd}
            position={center}
          />
        ) : null}
      </Map>
    </div>
  );
}
