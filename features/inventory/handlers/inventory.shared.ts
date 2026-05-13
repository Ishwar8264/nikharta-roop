import { z } from "zod";

import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { readJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import {
  INVENTORY_CODES,
  INVENTORY_MESSAGES,
} from "@/features/inventory/constants/inventory.constants";
import { inventoryError } from "@/features/inventory/responses/inventory.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type InventoryAdminUser = {
  branchId?: string | null;
  id: string;
  role: string;
};

/**
 * Allows only admin roles to reach inventory handlers.
 */
export async function requireInventoryAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth;
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: inventoryError({
        code: INVENTORY_CODES.FORBIDDEN,
        message: INVENTORY_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }
  return auth;
}

/**
 * Parses JSON bodies with inventory-owned validation errors.
 */
export async function parseInventoryBody<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const parsed = schema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return {
      data: null,
      error: inventoryError({
        code: INVENTORY_CODES.VALIDATION_ERROR,
        message: parsed.error.issues[0]?.message ?? INVENTORY_MESSAGES.VALIDATION_ERROR,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }
  return { data: parsed.data as z.output<TSchema>, error: null };
}

/**
 * Carries expected inventory errors across helper boundaries.
 */
export class InventoryVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
