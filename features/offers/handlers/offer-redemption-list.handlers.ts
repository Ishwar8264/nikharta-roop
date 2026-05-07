import { getDb } from "@/db";
import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { OFFER_CODES, OFFER_MESSAGES } from "@/features/offers/constants/offer.constants";
import { offerRedemptionSelect } from "@/features/offers/helpers/offer.selectors";
import {
  listMyOfferRedemptionsQuerySchema,
  listOfferRedemptionsQuerySchema,
  type ListOfferRedemptionsQueryInput,
} from "@/schema/offers/schema.offer-redemption";
import { handleOfferError } from "./offer.errors";
import {
  offerRedemptionListResponse,
  parseOfferRedemptionQuery,
} from "./offer-redemption-list.shared";
import { resolveOfferRedemptionBranch } from "./offer-redemption.scopes";
import { requireOfferAdmin, type OfferAdminUser } from "./offer.shared";

/**
 * Handles current user's offer redemption history requests.
 */
export async function handleListMyOfferRedemptions(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth.error;
  const query = parseOfferRedemptionQuery(request, listMyOfferRedemptionsQuerySchema);
  if (!query.success) return query.error;
  try {
    const redemptions = await getDb().offerRedemption.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: offerRedemptionSelect(),
      take: query.data.limit,
      where: { userId: auth.session.userId },
    });
    return offerRedemptionListResponse(redemptions, query.data.limit);
  } catch (error) {
    return handleOfferError(error, {
      code: OFFER_CODES.OFFER_REDEMPTIONS_LOAD_FAILED,
      handler: "handleListMyOfferRedemptions",
      message: OFFER_MESSAGES.OFFER_REDEMPTIONS_LOAD_FAILED,
    });
  }
}

/**
 * Handles admin offer redemption listing requests.
 */
export async function handleListAdminOfferRedemptions(request: Request) {
  const auth = await requireOfferAdmin(request);
  if (!auth.success) return auth.error;
  const query = parseOfferRedemptionQuery(request, listOfferRedemptionsQuerySchema);
  if (!query.success) return query.error;
  return listAdminOfferRedemptions(query.data, auth.session.user);
}

/**
 * Lists redemptions with branch-admin scoping through booking branch.
 */
async function listAdminOfferRedemptions(
  input: ListOfferRedemptionsQueryInput,
  admin: OfferAdminUser,
) {
  try {
    const branchId = resolveOfferRedemptionBranch(input.branchId, admin);
    const redemptions = await getDb().offerRedemption.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: offerRedemptionSelect(),
      take: input.limit,
      where: {
        booking: branchId ? { branchId } : undefined,
        bookingId: input.bookingId,
        offerId: input.offerId,
        userId: input.userId,
      },
    });
    return offerRedemptionListResponse(redemptions, input.limit);
  } catch (error) {
    return handleOfferError(error, {
      code: OFFER_CODES.OFFER_REDEMPTIONS_LOAD_FAILED,
      handler: "listAdminOfferRedemptions",
      message: OFFER_MESSAGES.OFFER_REDEMPTIONS_LOAD_FAILED,
    });
  }
}
