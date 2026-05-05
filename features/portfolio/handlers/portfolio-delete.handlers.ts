import { getDb } from "@/db";
import {
  PORTFOLIO_CODES,
  PORTFOLIO_MESSAGES,
} from "@/features/portfolio/constants/portfolio.constants";
import { portfolioJson } from "@/features/portfolio/responses/portfolio.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { loadManageablePortfolioItem } from "./portfolio.guards";
import { handlePortfolioError, throwPortfolioNotFound } from "./portfolio.errors";
import {
  requirePortfolioAdmin,
  type PortfolioAdminUser,
} from "./portfolio.shared";

/**
 * Handles admin portfolio delete requests after admin authentication.
 */
export async function handleDeleteAdminPortfolio(
  request: Request,
  portfolioItemId: string,
) {
  const auth = await requirePortfolioAdmin(request);
  if (!auth.success) return auth.error;
  return deleteAdminPortfolio(portfolioItemId, auth.session.user);
}

/**
 * Deletes a portfolio item after branch ownership validation.
 */
async function deleteAdminPortfolio(
  portfolioItemId: string,
  admin: PortfolioAdminUser,
) {
  try {
    const current = await loadManageablePortfolioItem(portfolioItemId, admin);
    if (!current) throwPortfolioNotFound();
    await getDb().portfolioItem.delete({ where: { id: portfolioItemId } });
    return portfolioJson({
      code: PORTFOLIO_CODES.PORTFOLIO_DELETED,
      data: { portfolioItemId },
      message: PORTFOLIO_MESSAGES.PORTFOLIO_DELETED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handlePortfolioError(error, {
      code: PORTFOLIO_CODES.PORTFOLIO_DELETE_FAILED,
      handler: "deleteAdminPortfolio",
      message: PORTFOLIO_MESSAGES.PORTFOLIO_DELETE_FAILED,
    });
  }
}
