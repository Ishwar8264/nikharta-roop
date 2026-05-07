import { AuthEventType } from "@prisma/client";
import { z } from "zod";

/**
 * Validates CUID identifiers accepted by auth event endpoints.
 */
const idSchema = z.string().trim().cuid();

const optionalIdSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  idSchema.optional(),
);

const optionalMobileSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().regex(/^\d{10}$/).optional(),
);

export const listAuthEventsQuerySchema = z.object({
  branchId: optionalIdSchema,
  from: z.string().trim().date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  mobile: optionalMobileSchema,
  to: z.string().trim().date().optional(),
  type: z.enum(AuthEventType).optional(),
  userId: optionalIdSchema,
});

export type ListAuthEventsQueryInput = z.infer<typeof listAuthEventsQuerySchema>;
