// Converts admin branch forms into the branch API request shape.
export function toBranchBody(formData: FormData) {
  return {
    address: getFormString(formData, "address"),
    city: getFormString(formData, "city"),
    closeTime: getFormString(formData, "closeTime"),
    googleMapsUrl: getOptionalString(formData, "googleMapsUrl"),
    isActive: formData.get("isActive") === "on",
    latitude: getOptionalNumber(formData, "latitude"),
    longitude: getOptionalNumber(formData, "longitude"),
    nameEn: getOptionalString(formData, "nameEn"),
    nameHi: getFormString(formData, "nameHi"),
    openTime: getFormString(formData, "openTime"),
    phone: getFormString(formData, "phone"),
    placeId: getOptionalString(formData, "placeId"),
  };
}

function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = getFormString(formData, key);

  return value || null;
}

function getOptionalNumber(formData: FormData, key: string) {
  const value = getFormString(formData, key);

  return value ? Number(value) : null;
}
