export const runtime = "nodejs";

/**
 * Routes offer validation requests to the offers feature handler.
 */
export { handleValidateOffer as POST } from "@/features/offers/handlers/offer.handlers";
