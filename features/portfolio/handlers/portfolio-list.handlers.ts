/**
 * Purpose: Portfolio list handlers for public and admin APIs.
 * Responsibilities: validate list filters, enforce admin branch scope, and return mapped gallery rows.
 * Important notes: unassigned admins can browse all branches while assigned admins stay branch-scoped.
 */
import { getDb } from "@/db";
import {
  PORTFOLIO_CODES,
  PORTFOLIO_MESSAGES,
} from "@/features/portfolio/constants/portfolio.constants";
import { portfolioSelect } from "@/features/portfolio/helpers/portfolio.selectors";
import { portfolioError } from "@/features/portfolio/responses/portfolio.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  adminListPortfolioQuerySchema,
  listPortfolioQuerySchema,
  type AdminListPortfolioQueryInput,
  type ListPortfolioQueryInput,
} from "@/schema/portfolio/schema.portfolio";
import { assertCanManagePortfolioBranch } from "./portfolio.guards";
import { handlePortfolioError } from "./portfolio.errors";
import {
  parsePortfolioQuery,
  portfolioListResponse,
  portfolioWhere,
} from "./portfolio-list.shared";
import {
  PortfolioVisibleError,
  requirePortfolioAdmin,
} from "./portfolio.shared";
/**
 * Handles public portfolio listing requests.
 */
export async function handleListPortfolio(request: Request) {
  const query = parsePortfolioQuery(request, listPortfolioQuerySchema);
  if (!query.success) return query.error;
  return listPublicPortfolio(query.data);
}

/**
 * Handles admin portfolio listing requests after admin authentication.
 */
export async function handleListAdminPortfolio(request: Request) {
  const auth = await requirePortfolioAdmin(request);
  if (!auth.success) return auth.error;
  const query = parsePortfolioQuery(request, adminListPortfolioQuerySchema);
  if (!query.success) return query.error;
  return listAdminPortfolio(query.data, auth.session.user);
}

/**
 * Lists published portfolio items for storefront gallery surfaces.
 */
async function listPublicPortfolio(input: ListPortfolioQueryInput) {
  try {
    const items = await getDb().portfolioItem.findMany({
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      select: portfolioSelect(),
      take: input.limit,
      where: portfolioWhere(input, true),
    });
    return portfolioListResponse(items, input.limit);
  } catch (error) {
    console.error(PORTFOLIO_CODES.PORTFOLIO_LOAD_FAILED, { error });
    return portfolioError({
      code: PORTFOLIO_CODES.PORTFOLIO_LOAD_FAILED,
      message: PORTFOLIO_MESSAGES.PORTFOLIO_LOAD_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Lists portfolio items for operations with branch-admin scoping.
 */
async function listAdminPortfolio(
  input: AdminListPortfolioQueryInput,
  admin: { branchId?: string | null; id: string; role: string },
) {
  try {
    const branchId = resolveAdminPortfolioBranch(input.branchId, admin);
    const items = await getDb().portfolioItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: portfolioSelect(),
      take: input.limit,
      where: portfolioWhere({ ...input, branchId }, input.isPublished),
    });
    return portfolioListResponse(items, input.limit);
  } catch (error) {
    return handlePortfolioError(error, {
      code: PORTFOLIO_CODES.PORTFOLIO_LOAD_FAILED,
      handler: "listAdminPortfolio",
      message: PORTFOLIO_MESSAGES.PORTFOLIO_LOAD_FAILED,
    });
  }
}

/**
 * Resolves admin list branch scope without exposing cross-branch gallery rows.
 */
function resolveAdminPortfolioBranch(
  requestedBranchId: string | undefined,
  admin: { branchId?: string | null; id: string; role: string },
) {
  if (admin.role === "SUPER_ADMIN" || !admin.branchId) return requestedBranchId;
  if (admin.branchId && (!requestedBranchId || requestedBranchId === admin.branchId)) {
    assertCanManagePortfolioBranch(admin, admin.branchId);
    return admin.branchId;
  }
  throw new PortfolioVisibleError(
    PORTFOLIO_CODES.FORBIDDEN,
    PORTFOLIO_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}
