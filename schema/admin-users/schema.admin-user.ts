import { UserRole } from "@prisma/client";
import { z } from "zod";

/**
 * Validates CUID identifiers accepted by admin user endpoints.
 */
const idSchema = z.string().trim().cuid();

const optionalIdSchema: z.ZodType<string | undefined, z.ZodTypeDef, unknown> = z.preprocess(
  (value) => (value === "" ? undefined : value),
  idSchema.optional(),
);

const optionalBooleanSchema: z.ZodType<boolean | undefined, z.ZodTypeDef, unknown> = z.preprocess(
  (value) => {
    if (value === "" || value === undefined) return undefined;
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  },
  z.boolean().optional(),
);

export const listAdminUsersQuerySchema = z.object({
  branchId: optionalIdSchema,
  isActive: optionalBooleanSchema,
  limit: z.coerce.number().int().min(1).max(100).default(50),
  role: z.nativeEnum(UserRole).optional(),
  search: z.string().trim().max(100).optional(),
});

const adminUserBodySchema = z.object({
  branchId: z
    .union([idSchema, z.literal(""), z.null()])
    .optional()
    .transform((value) => (value === "" ? null : value)),
  email: z.string().trim().toLowerCase().email().max(150).nullable().optional(),
  isActive: z.boolean().optional(),
  name: z.string().trim().min(2).max(100).nullable().optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export const updateAdminUserSchema = adminUserBodySchema.refine(
  (value) => Object.keys(value).length > 0,
  { message: "Send at least one user field to update." },
);

export const suspendAdminUserSchema = z.object({
  isActive: z.boolean().default(false),
});

export type ListAdminUsersQueryInput = z.infer<typeof listAdminUsersQuerySchema>;
export type SuspendAdminUserInput = z.infer<typeof suspendAdminUserSchema>;
export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>;
