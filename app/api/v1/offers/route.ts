export const runtime = "nodejs";

/**
 * Routes public offer listing requests to the offers feature handler.
 */
export { handleListOffers as GET } from "@/features/offers/handlers/offer.handlers";
