import { getDb } from "@/db";
import {
  PORTFOLIO_CODES,
  PORTFOLIO_MESSAGES,
} from "@/features/portfolio/constants/portfolio.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  PortfolioVisibleError,
  type PortfolioAdminUser,
} from "./portfolio.shared";

/**
 * Ensures branch admins only manage their assigned branch.
 */
export function assertCanManagePortfolioBranch(
  admin: PortfolioAdminUser,
  branchId: string,
) {
  if (admin.role === "SUPER_ADMIN" || admin.branchId === branchId) return;
  throw new PortfolioVisibleError(
    PORTFOLIO_CODES.FORBIDDEN,
    PORTFOLIO_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}

/**
 * Verifies the target branch is active before portfolio writes.
 */
export async function assertActivePortfolioBranch(branchId: string) {
  const branch = await getDb().branch.findFirst({
    select: { id: true },
    where: { id: branchId, isActive: true },
  });
  if (branch) return;
  throw new PortfolioVisibleError(
    PORTFOLIO_CODES.BRANCH_NOT_FOUND,
    PORTFOLIO_MESSAGES.BRANCH_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}

/**
 * Loads one portfolio item and verifies admin branch ownership.
 */
export async function loadManageablePortfolioItem(
  portfolioItemId: string,
  admin: PortfolioAdminUser,
) {
  const item = await getDb().portfolioItem.findUnique({
    select: { branchId: true, id: true },
    where: { id: portfolioItemId },
  });
  if (!item) return null;
  assertCanManagePortfolioBranch(admin, item.branchId);
  return item;
}
