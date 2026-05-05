export const runtime = "nodejs";

/**
 * Routes admin offer creation requests to the offers feature handler.
 */
export { handleCreateAdminOffer as POST } from "@/features/offers/handlers/offer.handlers";
