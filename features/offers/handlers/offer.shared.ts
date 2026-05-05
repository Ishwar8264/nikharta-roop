import type { ZodType } from "zod";

import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { readJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import {
  OFFER_CODES,
  OFFER_MESSAGES,
} from "@/features/offers/constants/offer.constants";
import { offerError } from "@/features/offers/responses/offer.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type OfferAdminUser = {
  branchId?: string | null;
  id: string;
  role: string;
};

/**
 * Requires a signed-in user for public offer validation.
 */
export async function requireOfferAuth(request: Request) {
  return getAuthenticatedSession(request);
}

/**
 * Allows only admin roles to reach offer management handlers.
 */
export async function requireOfferAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth;
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: offerError({
        code: OFFER_CODES.FORBIDDEN,
        message: OFFER_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }
  return auth;
}

/**
 * Parses JSON bodies with offer-owned validation error codes.
 */
export async function parseOfferBody<T>(request: Request, schema: ZodType<T>) {
  const parsed = schema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return {
      data: null,
      error: offerError({
        code: OFFER_CODES.VALIDATION_ERROR,
        message: parsed.error.issues[0]?.message ?? OFFER_MESSAGES.VALIDATION_ERROR,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }
  return { data: parsed.data, error: null };
}

/**
 * Carries expected offer errors across helper boundaries.
 */
export class OfferVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
