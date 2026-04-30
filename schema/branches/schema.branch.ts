import { z } from "zod";

const optionalUrlSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z
    .string()
    .trim()
    .url()
    .refine((url) => url.startsWith("https://"), {
      message: "Map URL must use https.",
    })
    .nullable()
    .optional(),
);

const optionalTextSchema = (maxLength: number) =>
  z.preprocess(
    (value) => (value === "" ? null : value),
    z.string().trim().max(maxLength).nullable().optional(),
  );

const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: "Time must be in HH:mm or HH:mm:ss format.",
  })
  .transform((value) => toTimeDate(value));

const optionalLatitudeSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z.number().min(-90).max(90).nullable().optional(),
);

const optionalLongitudeSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z.number().min(-180).max(180).nullable().optional(),
);

const branchFieldsSchema = z.object({
  address: z.string().trim().min(3).max(1000),
  city: z.string().trim().min(2).max(100),
  closeTime: timeSchema,
  googleMapsUrl: optionalUrlSchema,
  isActive: z.boolean().optional(),
  latitude: optionalLatitudeSchema,
  longitude: optionalLongitudeSchema,
  nameEn: optionalTextSchema(200),
  nameHi: z.string().trim().min(2).max(200),
  openTime: timeSchema,
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, {
      message: "Please enter a valid 10-digit Indian mobile number.",
    }),
  placeId: optionalTextSchema(200),
});

const branchCreateSchema = branchFieldsSchema
  .refine((value) => value.openTime < value.closeTime, {
    message: "Open time must be before close time.",
    path: ["closeTime"],
  })
  .refine(
    (value) =>
      (value.latitude === undefined || value.latitude === null) ===
      (value.longitude === undefined || value.longitude === null),
    {
      message: "Latitude and longitude must be provided together.",
      path: ["longitude"],
    },
  );

/**
 * Request schema for POST /api/v1/admin/branches.
 */
export const createBranchSchema = branchCreateSchema;

/**
 * Request schema for PATCH /api/v1/admin/branches/:branchId.
 */
export const updateBranchSchema = branchFieldsSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Please provide at least one branch field.",
  })
  .refine(
    (value) =>
      !value.openTime || !value.closeTime || value.openTime < value.closeTime,
    {
      message: "Open time must be before close time.",
      path: ["closeTime"],
    },
  )
  .refine(
    (value) =>
      (value.latitude !== undefined) === (value.longitude !== undefined),
    {
      message: "Latitude and longitude must be patched together.",
      path: ["longitude"],
    },
  );

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;

/**
 * Converts HH:mm or HH:mm:ss into a stable Date value for Prisma @db.Time.
 */
function toTimeDate(value: string) {
  const [hours = "00", minutes = "00", seconds = "00"] = value.split(":");

  return new Date(
    Date.UTC(1970, 0, 1, Number(hours), Number(minutes), Number(seconds)),
  );
}
