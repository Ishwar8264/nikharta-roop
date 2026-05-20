/**
 * Purpose: Admin offer listing handler.
 * Responsibilities: expose protected offer management reads with branch and status filters.
 * Important notes: list includes service relations so admin cards can show offer restrictions.
 */
import { getDb } from "@/db";
import {
  OFFER_CODES,
  OFFER_MESSAGES,
} from "@/features/offers/constants/offer.constants";
import { toPublicOffer } from "@/features/offers/helpers/offer.mapper";
import { offerSelect } from "@/features/offers/helpers/offer.selectors";
import { offerJson } from "@/features/offers/responses/offer.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  listAdminOffersQuerySchema,
  type ListAdminOffersQueryInput,
} from "@/schema/offers/schema.offer";
import { resolveOfferAdminBranchFilter } from "./offer.admin-guards";
import { handleOfferError, offerValidationError } from "./offer.errors";
import { requireOfferAdmin, type OfferAdminUser } from "./offer.shared";

/**
 * Handles admin offer listing including inactive offers.
 */
export async function handleListAdminOffers(request: Request) {
  const auth = await requireOfferAdmin(request);
  if (!auth.success) return auth.error;
  const query = listAdminOffersQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!query.success) return offerValidationError(query.error.issues[0]?.message);
  return listAdminOffers(query.data, auth.session.user);
}

/**
 * Lists offers visible to the authenticated admin.
 */
async function listAdminOffers(
  input: ListAdminOffersQueryInput,
  admin: OfferAdminUser,
) {
  try {
    const branchId = resolveOfferAdminBranchFilter(input.branchId, admin);
    const offers = await getDb().offer.findMany({
      orderBy: [{ validUntil: "asc" }, { titleHi: "asc" }],
      select: offerSelect(),
      take: input.limit,
      where: {
        branchId,
        isActive:
          input.status === "active"
            ? true
            : input.status === "inactive"
              ? false
              : undefined,
      },
    });

    return offerJson({
      code: OFFER_CODES.OFFERS_LISTED,
      data: { limit: input.limit, offers: offers.map(toPublicOffer) },
      message: OFFER_MESSAGES.OFFERS_LISTED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleOfferError(error, {
      code: OFFER_CODES.OFFERS_LOAD_FAILED,
      handler: "listAdminOffers",
      message: OFFER_MESSAGES.OFFERS_LOAD_FAILED,
    });
  }
}
