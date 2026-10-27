import { z } from "zod";

/** Only user-profile display fields are writable; ownership and lifecycle are server-owned. */
export const createProfileSchema = z.strictObject({
  displayName: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens."),
  bio: z.string().trim().max(500).nullish(),
  avatar: z
    .url({ protocol: /^https?$/ })
    .max(2048)
    .nullish(),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
