import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const branchFormSchema = z
  .object({
    address: z.string().trim().min(3, "Address is required."),
    city: z.string().trim().min(2, "City is required."),
    closeTime: z.string().regex(timePattern, "Close time is required."),
    googleMapsUrl: z.string().refine((value) => !value || isHttpsUrl(value), {
      message: "Map URL must be a valid https URL.",
    }),
    isActive: z.boolean(),
    latitude: coordinateSchema(-90, 90, "Latitude"),
    longitude: coordinateSchema(-180, 180, "Longitude"),
    nameEn: z.string(),
    nameHi: z.string().trim().min(2, "Hindi name is required."),
    openTime: z.string().regex(timePattern, "Open time is required."),
    phone: z.string().regex(/^[6-9]\d{9}$/, {
      message: "Enter a valid 10-digit Indian mobile number.",
    }),
    placeId: z.string(),
  })
  .superRefine((value, context) => {
    if (value.openTime && value.closeTime && value.openTime >= value.closeTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Close time must be after open time.",
        path: ["closeTime"],
      });
    }

    if (Boolean(value.latitude) !== Boolean(value.longitude)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Latitude and longitude must be provided together.",
        path: ["longitude"],
      });
    }
  });

function coordinateSchema(min: number, max: number, label: string) {
  return z.string().refine((value) => {
    if (!value) return true;

    const numberValue = Number(value);

    return Number.isFinite(numberValue) && numberValue >= min && numberValue <= max;
  }, `${label} must be between ${min} and ${max}.`);
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
