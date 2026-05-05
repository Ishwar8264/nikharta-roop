import { getDb } from "@/db";
import {
  OFFER_CODES,
  OFFER_MESSAGES,
} from "@/features/offers/constants/offer.constants";
import { toOfferUpdateData } from "@/features/offers/helpers/offer.data";
import { toPublicOffer } from "@/features/offers/helpers/offer.mapper";
import { offerSelect } from "@/features/offers/helpers/offer.selectors";
import { offerJson } from "@/features/offers/responses/offer.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  updateOfferSchema,
  type UpdateOfferInput,
} from "@/schema/offers/schema.offer";
import {
  assertActiveOfferBranch,
  assertCanManageOfferBranch,
  resolveOfferBranchId,
} from "./offer.admin-guards";
import { handleOfferError } from "./offer.errors";
import {
  assertExistingOfferServicesMatchBranch,
  loadManageableOffer,
} from "./offer.service-guards";
import {
  parseOfferBody,
  requireOfferAdmin,
  OfferVisibleError,
  type OfferAdminUser,
} from "./offer.shared";

/**
 * Handles admin offer patch requests after admin authentication.
 */
export async function handleUpdateAdminOffer(request: Request, offerId: string) {
  const auth = await requireOfferAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseOfferBody(request, updateOfferSchema);
  if (body.error) return body.error;
  return updateAdminOffer(offerId, body.data, auth.session.user);
}

/**
 * Updates an offer while preserving branch ownership and service consistency.
 */
async function updateAdminOffer(
  offerId: string,
  input: UpdateOfferInput,
  admin: OfferAdminUser,
) {
  try {
    const current = await loadManageableOffer(offerId);
    assertCanManageOfferBranch(admin, current.branchId);
    const branchId =
      input.branchId === undefined
        ? current.branchId
        : resolveOfferBranchId(input.branchId, admin);
    assertOfferDateWindow(
      input.validFrom ?? current.validFrom,
      input.validUntil ?? current.validUntil,
    );
    await assertActiveOfferBranch(branchId);
    await assertExistingOfferServicesMatchBranch(offerId, branchId);
    const offer = await getDb().offer.update({
      data: toOfferUpdateData(input, branchId),
      select: offerSelect(),
      where: { id: offerId },
    });
    return offerJson({
      code: OFFER_CODES.OFFER_UPDATED,
      data: { offer: toPublicOffer(offer) },
      message: OFFER_MESSAGES.OFFER_UPDATED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleOfferError(error, {
      code: OFFER_CODES.OFFER_UPDATE_FAILED,
      handler: "updateAdminOffer",
      message: OFFER_MESSAGES.OFFER_UPDATE_FAILED,
    });
  }
}

/**
 * Ensures partial date patches cannot invert the offer validity window.
 */
function assertOfferDateWindow(validFrom: Date, validUntil: Date) {
  if (validFrom < validUntil) return;
  throw new OfferVisibleError(
    OFFER_CODES.VALIDATION_ERROR,
    "Offer start date must be before end date.",
    HTTP_STATUS.UNPROCESSABLE_ENTITY,
  );
}
