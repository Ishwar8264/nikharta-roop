export const runtime = "nodejs";

/**
 * Routes current user's offer redemption history requests to the feature handler.
 */
export { handleListMyOfferRedemptions as GET } from "@/features/offers/handlers/offer.handlers";
