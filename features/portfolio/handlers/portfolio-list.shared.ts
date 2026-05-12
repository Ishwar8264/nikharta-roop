import { z } from "zod";

import {
  PORTFOLIO_CODES,
  PORTFOLIO_MESSAGES,
} from "@/features/portfolio/constants/portfolio.constants";
import {
  type PortfolioRow,
  toPublicPortfolioItem,
} from "@/features/portfolio/helpers/portfolio.mapper";
import {
  portfolioError,
  portfolioJson,
} from "@/features/portfolio/responses/portfolio.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import type { ListPortfolioQueryInput } from "@/schema/portfolio/schema.portfolio";

/**
 * Builds the shared Prisma where clause for portfolio list endpoints.
 */
export function portfolioWhere(
  input: ListPortfolioQueryInput,
  isPublished?: boolean,
) {
  return {
    branch: { isActive: true },
    branchId: input.branchId,
    isFeatured: input.featured,
    isPublished,
    packageId: input.packageId,
    serviceId: input.serviceId,
    staffId: input.staffId,
  };
}

/**
 * Parses portfolio list query strings with feature-owned errors.
 */
export function parsePortfolioQuery<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const parsed = schema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (parsed.success) {
    return { data: parsed.data as z.output<TSchema>, success: true as const };
  }
  return {
    error: portfolioError({
      code: PORTFOLIO_CODES.VALIDATION_ERROR,
      message: PORTFOLIO_MESSAGES.VALIDATION_ERROR,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    }),
    success: false as const,
  };
}

/**
 * Wraps a portfolio collection in the shared response shape.
 */
export function portfolioListResponse(items: PortfolioRow[], limit: number) {
  return portfolioJson({
    code: PORTFOLIO_CODES.PORTFOLIO_LISTED,
    data: { limit, portfolio: items.map(toPublicPortfolioItem) },
    message: PORTFOLIO_MESSAGES.PORTFOLIO_LISTED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}
