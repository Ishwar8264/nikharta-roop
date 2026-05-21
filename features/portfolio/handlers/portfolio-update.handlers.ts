/**
 * Purpose: Admin portfolio update handler.
 * Responsibilities: authenticate admins, validate branch/relation scope, and update portfolio items.
 * Important notes: independent branch and relation checks run together once the final branch is known.
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
  updatePortfolioSchema,
  type UpdatePortfolioInput,
} from "@/schema/portfolio/schema.portfolio";
import {
  assertActivePortfolioBranch,
  loadManageablePortfolioItem,
} from "./portfolio.guards";
import { assertPortfolioRelations } from "./portfolio.relations";
import { handlePortfolioError, throwPortfolioNotFound } from "./portfolio.errors";
import {
  parsePortfolioBody,
  requirePortfolioAdmin,
  type PortfolioAdminUser,
} from "./portfolio.shared";

/**
 * Handles admin portfolio patch requests after admin authentication.
 */
export async function handleUpdateAdminPortfolio(
  request: Request,
  portfolioItemId: string,
) {
  const auth = await requirePortfolioAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parsePortfolioBody(request, updatePortfolioSchema);
  if (body.error) return body.error;
  return updateAdminPortfolio(portfolioItemId, body.data, auth.session.user);
}

/**
 * Updates a portfolio item while preserving branch ownership.
 */
async function updateAdminPortfolio(
  portfolioItemId: string,
  input: UpdatePortfolioInput,
  admin: PortfolioAdminUser,
) {
  try {
    const current = await loadManageablePortfolioItem(portfolioItemId, admin);
    if (!current) throwPortfolioNotFound();
    const branchId = input.branchId ?? current.branchId;
    await Promise.all([
      assertActivePortfolioBranch(branchId),
      assertPortfolioRelations(input, branchId),
    ]);
    const item = await getDb().portfolioItem.update({
      data: input,
      select: portfolioSelect(),
      where: { id: portfolioItemId },
    });
    return portfolioJson({
      code: PORTFOLIO_CODES.PORTFOLIO_UPDATED,
      data: { portfolioItem: toPublicPortfolioItem(item) },
      message: PORTFOLIO_MESSAGES.PORTFOLIO_UPDATED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handlePortfolioError(error, {
      code: PORTFOLIO_CODES.PORTFOLIO_UPDATE_FAILED,
      handler: "updateAdminPortfolio",
      message: PORTFOLIO_MESSAGES.PORTFOLIO_UPDATE_FAILED,
    });
  }
}
