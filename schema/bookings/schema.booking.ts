import { z } from "zod";

/**
 * Validates CUID identifiers accepted by booking endpoints.
 */
const idSchema = z.string().trim().cuid();

/**
 * Validates local booking dates passed as YYYY-MM-DD.
 */
const bookingDateSchema = z
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
    {
      message: "Date must be valid.",
    },
  );

/**
 * Query schema for GET /api/v1/bookings/slots.
 */
export const listBookingSlotsQuerySchema = z.object({
  branchId: idSchema,
  date: bookingDateSchema,
  serviceId: idSchema,
  serviceVariantId: z.preprocess(
    (value) => (value === "" ? undefined : value),
    idSchema.optional(),
  ),
  staffId: z.preprocess(
    (value) => (value === "" ? undefined : value),
    idSchema.optional(),
  ),
});

export type ListBookingSlotsQueryInput = z.infer<
  typeof listBookingSlotsQuerySchema
>;
