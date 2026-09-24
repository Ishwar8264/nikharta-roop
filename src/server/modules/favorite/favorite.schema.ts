import { z } from "zod";

import { resourceIdSchema } from "@/server/modules/salon/salon.schema";

/** The three target types a favorite can point at. */
const targetTypeSchema = z.enum(["salon", "service", "product"], {
  error: "Favorite type must be salon, service, or product",
});

/**
 * Body for adding a favorite.
 *
 * Why:
 * The favorite model is polymorphic — one table covers salons, services, and
 * products. The `type` discriminator selects which FK column is populated.
 */
export const addFavoriteSchema = z.strictObject({
  type: targetTypeSchema,
  targetId: resourceIdSchema,
});

/** List query. */
export const listFavoritesQuerySchema = z.strictObject({
  cursor: z
    .string({ error: "Cursor must be a string" })
    .pipe(resourceIdSchema)
    .optional(),
  limit: z.coerce
    .number({ error: "Limit must be a number" })
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(50, "Limit must be at most 50")
    .default(20),
  type: targetTypeSchema.optional(),
});

/** Check query — one of the three target types required. */
export const checkFavoriteQuerySchema = z.strictObject({
  type: targetTypeSchema,
  targetId: resourceIdSchema,
});

/** URL params for the delete route. */
export const favoriteParamSchema = z.strictObject({
  favoriteId: resourceIdSchema,
});
