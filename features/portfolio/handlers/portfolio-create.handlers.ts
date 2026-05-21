/**
 * Purpose: Admin portfolio creation handler.
 * Responsibilities: authenticate admins, validate branch/relation scope, and create portfolio items.
 * Important notes: independent branch and relation checks run together before writing.
 */
import { getDb } from "@/db";
import {
  PORTFOLIO_CODES,
  PORTFOLIO_MESSAGES,
} from "@/features/portfolio/constants/portfolio.constants";
import { toPublicPortfolioItem } from "@/features/portfolio/helpers/portfolio.mapper";
import { portfolioSelect } from "@/features/portfolio/helpers/portfolio.selectors";
import { portfolioJson } from "@/features/portfolio/responses/portfolio.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  createPortfolioSchema,
  type CreatePortfolioInput,
} from "@/schema/portfolio/schema.portfolio";
import {
  assertActivePortfolioBranch,
  assertCanManagePortfolioBranch,
} from "./portfolio.guards";
import { assertPortfolioRelations } from "./portfolio.relations";
import { handlePortfolioError } from "./portfolio.errors";
import {
  parsePortfolioBody,
  requirePortfolioAdmin,
  type PortfolioAdminUser,
} from "./portfolio.shared";

/**
 * Handles admin portfolio creation requests after admin authentication.
 */
export async function handleCreateAdminPortfolio(request: Request) {
  const auth = await requirePortfolioAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parsePortfolioBody(request, createPortfolioSchema);
  if (body.error) return body.error;
  return createAdminPortfolio(body.data, auth.session.user);
}

/**
 * Creates a portfolio item after branch and optional relation checks.
 */
async function createAdminPortfolio(
  input: CreatePortfolioInput,
  admin: PortfolioAdminUser,
) {
  try {
    assertCanManagePortfolioBranch(admin, input.branchId);
    await Promise.all([
      assertActivePortfolioBranch(input.branchId),
      assertPortfolioRelations(input, input.branchId),
    ]);
    const item = await getDb().portfolioItem.create({
      data: input,
      select: portfolioSelect(),
    });
    return portfolioJson({
      code: PORTFOLIO_CODES.PORTFOLIO_CREATED,
      data: { portfolioItem: toPublicPortfolioItem(item) },
      message: PORTFOLIO_MESSAGES.PORTFOLIO_CREATED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    return handlePortfolioError(error, {
      code: PORTFOLIO_CODES.PORTFOLIO_CREATE_FAILED,
      handler: "createAdminPortfolio",
      message: PORTFOLIO_MESSAGES.PORTFOLIO_CREATE_FAILED,
    });
  }
}
