import { z } from "zod";

import { resourceIdSchema } from "@/server/modules/salon/salon.schema";

export const createCustomerNoteSchema = z.strictObject({
  note: z
    .string({ error: "Note must be a string" })
    .trim()
    .min(1, "Note must not be empty")
    .max(2000, "Note must contain at most 2000 characters"),
});

export const customerNoteParamsSchema = z.strictObject({
  customerId: resourceIdSchema,
  noteId: resourceIdSchema,
});
