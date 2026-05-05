export const runtime = "nodejs";

/**
 * Routes public portfolio listing requests to the portfolio feature handler.
 */
export { handleListPortfolio as GET } from "@/features/portfolio/handlers/portfolio.handlers";
