export const runtime = "nodejs";

/**
 * Routes offer redemption requests to the offers feature handler.
 */
export { handleRedeemOffer as POST } from "@/features/offers/handlers/offer.handlers";
