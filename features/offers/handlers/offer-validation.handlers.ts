import { getDb } from "@/db";
import {
  OFFER_CODES,
  OFFER_MESSAGES,
} from "@/features/offers/constants/offer.constants";
import { toPublicOffer } from "@/features/offers/helpers/offer.mapper";
import { offerSelect } from "@/features/offers/helpers/offer.selectors";
import { offerJson } from "@/features/offers/responses/offer.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { validateOfferSchema } from "@/schema/offers/schema.offer";
import { offerInvalidError } from "./offer.errors";
import {
  calculateDiscount,
  getOfferInvalidReason,
} from "./offer-validation.helpers";
import {
  parseOfferBody,
  requireOfferAuth,
} from "./offer.shared";

/**
 * Handles authenticated coupon validation before booking creation.
 */
export async function handleValidateOffer(request: Request) {
  const auth = await requireOfferAuth(request);
  if (!auth.success) return auth.error;
  const body = await parseOfferBody(request, validateOfferSchema);
  if (body.error) return body.error;

  const now = new Date();
  const offer = await getDb().offer.findFirst({
    select: { ...offerSelect(), services: { select: { serviceId: true } } },
    where: {
      code: body.data.code,
      isActive: true,
      OR: [{ branchId: null }, { branchId: body.data.branchId }],
      validFrom: { lte: now },
      validUntil: { gte: now },
    },
  });
  if (!offer) return offerInvalidError();

  const userRedemptionCount = await getDb().offerRedemption.count({
    where: { offerId: offer.id, userId: auth.session.userId },
  });
  const invalidReason = getOfferInvalidReason(
    offer,
    body.data,
    userRedemptionCount,
  );
  if (invalidReason) return offerInvalidError(invalidReason);

  const discountAmount = calculateDiscount(offer, body.data.orderAmount);
  return offerJson({
    code: OFFER_CODES.OFFER_VALIDATED,
    data: {
      discountAmount: discountAmount.toFixed(2),
      finalAmount: (body.data.orderAmount - discountAmount).toFixed(2),
      offer: toPublicOffer({ ...offer, services: [] }),
    },
    message: OFFER_MESSAGES.OFFER_VALIDATED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}
