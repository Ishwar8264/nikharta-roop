import type {
  BranchLocationValue,
  BranchMapPoint,
} from "@/features/branches/types/branch-location.types";

const CITY_COMPONENTS = [
  "locality",
  "administrative_area_level_3",
  "administrative_area_level_2",
];

// Converts Google place details into the branch fields saved in the database.
export function parseGooglePlace(
  place: google.maps.places.PlaceResult,
): BranchLocationValue | null {
  const point = getPlacePoint(place);

  if (!point) return null;

  return {
    address: place.formatted_address ?? place.name ?? "",
    city: getCity(place.address_components),
    googleMapsUrl: place.url ?? buildGoogleMapsUrl(point, place.place_id),
    latitude: String(point.lat),
    longitude: String(point.lng),
    placeId: place.place_id ?? "",
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
    city: getCity(result.address_components),
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

function getPlacePoint(place: google.maps.places.PlaceResult) {
  const location = place.geometry?.location;

  if (!location) return null;

  return { lat: location.lat(), lng: location.lng() };
}

function getCity(components?: google.maps.GeocoderAddressComponent[]) {
  const city = components?.find((component) =>
    component.types.some((type) => CITY_COMPONENTS.includes(type)),
  );

  return city?.long_name ?? "";
}

function buildGoogleMapsUrl(point: BranchMapPoint, placeId?: string) {
  const params = new URLSearchParams({
    api: "1",
    query: `${point.lat},${point.lng}`,
  });

  if (placeId) params.set("query_place_id", placeId);

  return `https://www.google.com/maps/search/?${params.toString()}`;
}
