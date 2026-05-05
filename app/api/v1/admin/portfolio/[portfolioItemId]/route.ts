import {
  handleDeleteAdminPortfolio,
  handleUpdateAdminPortfolio,
} from "@/features/portfolio/handlers/portfolio.handlers";

export const runtime = "nodejs";

type AdminPortfolioRouteContext = {
  params: Promise<{ portfolioItemId: string }>;
};

/**
 * Routes admin portfolio patch requests to the portfolio feature handler.
 */
export async function PATCH(
  request: Request,
  context: AdminPortfolioRouteContext,
) {
  const { portfolioItemId } = await context.params;
  return handleUpdateAdminPortfolio(request, portfolioItemId);
}

/**
 * Routes admin portfolio delete requests to the portfolio feature handler.
 */
export async function DELETE(
  request: Request,
  context: AdminPortfolioRouteContext,
) {
  const { portfolioItemId } = await context.params;
  return handleDeleteAdminPortfolio(request, portfolioItemId);
}
