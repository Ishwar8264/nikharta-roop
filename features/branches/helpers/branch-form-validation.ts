import type {
  BranchFormErrors,
  BranchFormValues,
} from "@/features/branches/types/branch-form.types";

// Mirrors the branch API rules for instant form feedback.
export function validateBranchForm(values: BranchFormValues) {
  const errors: BranchFormErrors = {};

  requireLength(errors, "nameHi", values.nameHi, 2, "Hindi name is required.");
  requireLength(errors, "city", values.city, 2, "City is required.");
  requireLength(errors, "address", values.address, 3, "Address is required.");

  if (!/^[6-9]\d{9}$/.test(values.phone)) {
    errors.phone = "Enter a valid 10-digit Indian mobile number.";
  }

  if (!values.openTime) errors.openTime = "Open time is required.";
  if (!values.closeTime) errors.closeTime = "Close time is required.";
  if (values.openTime && values.closeTime && values.openTime >= values.closeTime) {
    errors.closeTime = "Close time must be after open time.";
  }

  if (values.googleMapsUrl && !isHttpsUrl(values.googleMapsUrl)) {
    errors.googleMapsUrl = "Map URL must be a valid https URL.";
  }

  validateCoordinate(errors, "latitude", values.latitude, -90, 90);
  validateCoordinate(errors, "longitude", values.longitude, -180, 180);

  if (Boolean(values.latitude) !== Boolean(values.longitude)) {
    errors.longitude = "Latitude and longitude must be provided together.";
  }

  return errors;
}

export function hasBranchFormErrors(errors: BranchFormErrors) {
  return Object.keys(errors).length > 0;
}

function requireLength(
  errors: BranchFormErrors,
  key: keyof BranchFormValues,
  value: string,
  minLength: number,
  message: string,
) {
  if (value.trim().length < minLength) errors[key] = message;
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function validateCoordinate(
  errors: BranchFormErrors,
  key: "latitude" | "longitude",
  value: string,
  min: number,
  max: number,
) {
  if (!value) return;

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < min || numberValue > max) {
    errors[key] = key === "latitude"
      ? "Latitude must be between -90 and 90."
      : "Longitude must be between -180 and 180.";
  }
}
