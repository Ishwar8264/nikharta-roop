/**
 * Purpose: App Router entrypoint for admin offer collection APIs.
 * Responsibilities: expose protected offer listing and creation handlers.
 * Important notes: feature handlers own auth, validation, and branch scope checks.
 */
export const runtime = "nodejs";

export {
  handleCreateAdminOffer as POST,
  handleListAdminOffers as GET,
} from "@/features/offers/handlers/offer.handlers";
