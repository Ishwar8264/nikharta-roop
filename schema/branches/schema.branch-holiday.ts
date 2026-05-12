import { z } from "zod";

/**
 * Normalizes optional admin text fields that may be cleared from forms.
 */
const optionalTextSchema = (maxLength: number) =>
  z.preprocess(
    (value) => (value === "" ? null : value),
    z.string().trim().max(maxLength).nullable().optional(),
  ) as z.ZodType<string | null | undefined>;

/**
 * Validates branch holiday dates passed as YYYY-MM-DD.
 */
const holidayDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in YYYY-MM-DD format.",
  })
  .refine(
    (value) => {
      const parsed = new Date(`${value}T00:00:00.000Z`);
      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
      );
    },
    { message: "Date must be valid." },
  );

const branchHolidayFieldsSchema = z.object({
  date: holidayDateSchema,
  isClosed: z.boolean(),
  reasonEn: optionalTextSchema(300),
  reasonHi: optionalTextSchema(300),
});

/**
 * Query schema for GET /api/v1/admin/branches/:branchId/holidays.
 */
export const listBranchHolidaysQuerySchema = z.object({
  from: holidayDateSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  to: holidayDateSchema.optional(),
});

/**
 * Request schema for POST /api/v1/admin/branches/:branchId/holidays.
 */
export const createBranchHolidaySchema = branchHolidayFieldsSchema.extend({
  isClosed: z.boolean().optional().default(true),
});

/**
 * Request schema for PATCH /api/v1/admin/branches/:branchId/holidays/:holidayId.
 */
export const updateBranchHolidaySchema = branchHolidayFieldsSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Please provide at least one holiday field.",
  });

export type CreateBranchHolidayInput = Omit<
  z.infer<typeof createBranchHolidaySchema>,
  "isClosed"
> & {
  isClosed: boolean;
};
export type ListBranchHolidaysQueryInput = Omit<
  z.infer<typeof listBranchHolidaysQuerySchema>,
  "limit"
> & {
  limit: number;
};
export type UpdateBranchHolidayInput = z.infer<typeof updateBranchHolidaySchema>;

/**
 * Converts a YYYY-MM-DD holiday date into a Prisma @db.Date value.
 */
export function toHolidayDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}
