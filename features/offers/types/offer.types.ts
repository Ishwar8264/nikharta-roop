/**
 * Purpose: Shared TypeScript types for offer catalog and admin screens.
 * Responsibilities: align query, form, and component contracts with offer mapper response shapes.
 * Important notes: offer services are optional restrictions; empty services means offer can apply broadly.
 */
import type { toPublicOffer } from "@/features/offers/helpers/offer.mapper";

export type PublicOffer = ReturnType<typeof toPublicOffer>;

export type OfferListResult = {
  error: string | null;
  offers: PublicOffer[];
};

export type OfferServiceOption = {
  branchId: string;
  id: string;
  nameHi: string;
};
