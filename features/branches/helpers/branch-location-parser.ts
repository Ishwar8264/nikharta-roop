import type {
  BranchLocationValue,
  BranchMapPoint,
} from "@/features/branches/types/branch-location.types";

const CITY_COMPONENTS = [
  "locality",
  "administrative_area_level_3",
  "administrative_area_level_2",
];

// Converts modern Google Place details into the branch fields saved in the database.
export function parseGooglePlace(
  place: google.maps.places.Place,
): BranchLocationValue | null {
  const point = getModernPlacePoint(place);

  if (!point) return null;

  return {
    address: place.formattedAddress ?? place.displayName ?? "",
    city: getPlaceCity(place.addressComponents),
    googleMapsUrl: place.googleMapsURI ?? buildGoogleMapsUrl(point, place.id),
    latitude: String(point.lat),
    longitude: String(point.lng),
    placeId: place.id,
  };
}

export function parseGoogleGeocoderResult(
  result: google.maps.GeocoderResult,
): BranchLocationValue | null {
  const point = {
    lat: result.geometry.location.lat(),
    lng: result.geometry.location.lng(),
  };

  return {
    address: result.formatted_address,
    city: getGeocoderCity(result.address_components),
    googleMapsUrl: buildGoogleMapsUrl(point, result.place_id),
    latitude: String(point.lat),
    longitude: String(point.lng),
    placeId: result.place_id,
  };
}

export function getBranchLocationPoint(
  value: BranchLocationValue,
): BranchMapPoint | null {
  const lat = Number(value.latitude);
  const lng = Number(value.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}

function getModernPlacePoint(place: google.maps.places.Place) {
  const location = place.location;

  if (!location) return null;

  return { lat: location.lat(), lng: location.lng() };
}

function getGeocoderCity(components?: google.maps.GeocoderAddressComponent[]) {
  const city = components?.find((component) =>
    component.types.some((type) => CITY_COMPONENTS.includes(type)),
  );

  return city?.long_name ?? "";
}

function getPlaceCity(components?: google.maps.places.AddressComponent[]) {
  const city = components?.find((component) =>
    component.types.some((type) => CITY_COMPONENTS.includes(type)),
  );

  return city?.longText ?? "";
}

function buildGoogleMapsUrl(point: BranchMapPoint, placeId?: string) {
  const params = new URLSearchParams({
    api: "1",
    query: `${point.lat},${point.lng}`,
  });

  if (placeId) params.set("query_place_id", placeId);

  return `https://www.google.com/maps/search/?${params.toString()}`;
}
