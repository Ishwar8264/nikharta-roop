import { getDb } from "@/db";
import {
  OFFER_CODES,
  OFFER_MESSAGES,
} from "@/features/offers/constants/offer.constants";
import { toPublicOffer } from "@/features/offers/helpers/offer.mapper";
import { offerSelect } from "@/features/offers/helpers/offer.selectors";
import { offerJson } from "@/features/offers/responses/offer.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { listOffersQuerySchema } from "@/schema/offers/schema.offer";
import { handleOfferError, offerValidationError } from "./offer.errors";

/**
 * Handles active public offer listing for global and selected-branch offers.
 */
export async function handleListOffers(request: Request) {
  const query = listOffersQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!query.success) return offerValidationError(query.error.issues[0]?.message);

  try {
    const now = new Date();
    const offers = await getDb().offer.findMany({
      orderBy: [{ validUntil: "asc" }, { titleHi: "asc" }],
      select: offerSelect(),
      take: query.data.limit,
      where: {
        isActive: true,
        OR: query.data.branchId
          ? [{ branchId: null }, { branchId: query.data.branchId }]
          : [{ branchId: null }],
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
    });
    return offerJson({
      code: OFFER_CODES.OFFERS_LISTED,
      data: { limit: query.data.limit, offers: offers.map(toPublicOffer) },
      message: OFFER_MESSAGES.OFFERS_LISTED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleOfferError(error, {
      code: OFFER_CODES.OFFERS_LOAD_FAILED,
      handler: "handleListOffers",
      message: OFFER_MESSAGES.OFFERS_LOAD_FAILED,
    });
  }
}
