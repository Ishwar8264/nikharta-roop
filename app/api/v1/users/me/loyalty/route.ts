export const runtime = "nodejs";

/**
 * Routes current user's loyalty summary requests to the feature handler.
 */
export { handleGetMyLoyalty as GET } from "@/features/loyalty/handlers/loyalty.handlers";
