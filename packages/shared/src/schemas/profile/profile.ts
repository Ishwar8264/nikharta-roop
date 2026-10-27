import { z } from "zod";

/** Only user-profile display fields are writable; ownership and lifecycle are server-owned. */
export const createProfileSchema = z.strictObject({
  displayName: z.string({ error: "Enter a display name." })
    .trim()
    .min(2, "Use at least 2 characters for the display name.")
    .max(100, "Keep the display name within 100 characters."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Use at least 3 characters for the profile slug.")
    .max(120, "Keep the profile slug within 120 characters.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens."),
  bio: z.string().trim().max(500, "Keep the bio within 500 characters.").nullish(),
  avatar: z
    .url({ protocol: /^https?$/ })
    .max(2048)
    .nullish(),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;

/** PATCH changes only supplied display fields; null explicitly clears optional fields. */
export const updateProfileSchema = createProfileSchema.partial().refine(
  (input) => Object.values(input).some((value) => value !== undefined),
  { message: "Supply at least one profile field." },
);

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** Numbered pages follow Improve India's zero-based page and size contract. */
export const profileFilterSchema = z.strictObject({
  page: z.string()
    .regex(/^\d+$/, "Page must be a non-negative whole number.")
    .transform(Number)
    .pipe(z.number().int().min(0))
    .default(0),
  size: z.string()
    .regex(/^\d+$/, "Size must be a whole number between 1 and 100.")
    .transform(Number)
    .pipe(z.number().int().min(1, "Size must be between 1 and 100.").max(100, "Size must be between 1 and 100."))
    .default(20),
  search: z.string().trim().max(100, "Keep search within 100 characters.").optional(),
  slug: createProfileSchema.shape.slug.optional(),
  status: z.enum(["DRAFT", "ACTIVE", "SUSPENDED", "ARCHIVED"], { error: "Choose DRAFT, ACTIVE, SUSPENDED, or ARCHIVED as the profile status." }).optional(),
  sortBy: z.enum(["createdAt", "displayName", "slug"], { error: "Sort by createdAt, displayName, or slug." }).default("createdAt"),
  sortDir: z.enum(["asc", "desc"], { error: "Choose asc or desc as the sort direction." }).default("desc"),
}).refine((input) => input.page * input.size <= 10_000, {
  message: "Search depth limit reached. Narrow your filters or choose an earlier page.",
  path: ["page"],
});

export type ProfileFilterInput = z.infer<typeof profileFilterSchema>;
