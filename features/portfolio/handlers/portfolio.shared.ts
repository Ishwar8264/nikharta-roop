import type { ZodType } from "zod";

import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { readJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import {
  PORTFOLIO_CODES,
  PORTFOLIO_MESSAGES,
} from "@/features/portfolio/constants/portfolio.constants";
import { portfolioError } from "@/features/portfolio/responses/portfolio.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type PortfolioAdminUser = {
  branchId?: string | null;
  id: string;
  role: string;
};

/**
 * Allows only admin roles to reach portfolio management handlers.
 */
export async function requirePortfolioAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth;
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: portfolioError({
        code: PORTFOLIO_CODES.FORBIDDEN,
        message: PORTFOLIO_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }
  return auth;
}

/**
 * Parses JSON bodies with portfolio-owned validation error codes.
 */
export async function parsePortfolioBody<T>(request: Request, schema: ZodType<T>) {
  const parsed = schema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return {
      data: null,
      error: portfolioError({
        code: PORTFOLIO_CODES.VALIDATION_ERROR,
        message: parsed.error.issues[0]?.message ?? PORTFOLIO_MESSAGES.VALIDATION_ERROR,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }
  return { data: parsed.data, error: null };
}

/**
 * Carries expected portfolio errors across helper boundaries.
 */
export class PortfolioVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
