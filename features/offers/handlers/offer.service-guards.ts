import { getDb } from "@/db";
import {
  OFFER_CODES,
  OFFER_MESSAGES,
} from "@/features/offers/constants/offer.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { OfferVisibleError } from "./offer.shared";

/**
 * Verifies offer services belong to the selected branch scope.
 */
export async function assertOfferServices(
  serviceIds: string[],
  branchId: string | null,
) {
  if (serviceIds.length === 0) return;
  const uniqueIds = [...new Set(serviceIds)];
  const count = await getDb().service.count({
    where: {
      branchId: branchId ?? undefined,
      id: { in: uniqueIds },
      isActive: true,
    },
  });
  if (count !== uniqueIds.length) {
    throw new OfferVisibleError(
      OFFER_CODES.SERVICE_NOT_FOUND,
      OFFER_MESSAGES.SERVICE_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
    );
  }
}

/**
 * Loads an offer that an admin action wants to mutate.
 */
export async function loadManageableOffer(offerId: string) {
  const offer = await getDb().offer.findUnique({
    select: { branchId: true, id: true, validFrom: true, validUntil: true },
    where: { id: offerId },
  });
  if (!offer) {
    throw new OfferVisibleError(
      OFFER_CODES.OFFER_INVALID,
      OFFER_MESSAGES.OFFER_INVALID,
      HTTP_STATUS.NOT_FOUND,
    );
  }
  return offer;
}

/**
 * Blocks branch changes that would leave attached services from another branch.
 */
export async function assertExistingOfferServicesMatchBranch(
  offerId: string,
  branchId: string | null,
) {
  if (!branchId) return;
  const mismatched = await getDb().offerService.findFirst({
    select: { serviceId: true },
    where: {
      offerId,
      service: { branchId: { not: branchId } },
    },
  });
  if (mismatched) {
    throw new OfferVisibleError(
      OFFER_CODES.SERVICE_NOT_FOUND,
      OFFER_MESSAGES.SERVICE_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
    );
  }
}
