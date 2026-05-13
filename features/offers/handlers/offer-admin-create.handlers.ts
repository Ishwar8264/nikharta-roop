import { getDb } from "@/db";
import {
  OFFER_CODES,
  OFFER_MESSAGES,
} from "@/features/offers/constants/offer.constants";
import { toOfferCreateData } from "@/features/offers/helpers/offer.data";
import { toPublicOffer } from "@/features/offers/helpers/offer.mapper";
import { offerSelect } from "@/features/offers/helpers/offer.selectors";
import { offerJson } from "@/features/offers/responses/offer.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  createOfferSchema,
  type CreateOfferInput,
} from "@/schema/offers/schema.offer";
import { assertActiveOfferBranch, resolveOfferBranchId } from "./offer.admin-guards";
import { handleOfferError } from "./offer.errors";
import { assertOfferServices } from "./offer.service-guards";
import {
  parseOfferBody,
  requireOfferAdmin,
  type OfferAdminUser,
} from "./offer.shared";

/**
 * Handles admin offer creation requests after admin authentication.
 */
export async function handleCreateAdminOffer(request: Request) {
  const auth = await requireOfferAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseOfferBody(request, createOfferSchema);
  if (body.error) return body.error;
  return createAdminOffer(
    {
      ...body.data,
      serviceIds: body.data.serviceIds ?? [],
    },
    auth.session.user,
  );
}

/**
 * Creates an offer with branch scope and optional service restrictions.
 */
async function createAdminOffer(input: CreateOfferInput, admin: OfferAdminUser) {
  try {
    const branchId = resolveOfferBranchId(input.branchId, admin);
    await assertActiveOfferBranch(branchId);
    await assertOfferServices(input.serviceIds, branchId);
    const offer = await getDb().offer.create({
      data: toOfferCreateData(input, branchId),
      select: offerSelect(),
    });
    return offerJson({
      code: OFFER_CODES.OFFER_CREATED,
      data: { offer: toPublicOffer(offer) },
      message: OFFER_MESSAGES.OFFER_CREATED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    return handleOfferError(error, {
      code: OFFER_CODES.OFFER_CREATE_FAILED,
      handler: "createAdminOffer",
      message: OFFER_MESSAGES.OFFER_CREATE_FAILED,
    });
  }
}
