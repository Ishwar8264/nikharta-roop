import { getDb } from "@/db";
import {
  OFFER_CODES,
  OFFER_MESSAGES,
} from "@/features/offers/constants/offer.constants";
import { toPublicOffer } from "@/features/offers/helpers/offer.mapper";
import { offerSelect } from "@/features/offers/helpers/offer.selectors";
import { offerJson } from "@/features/offers/responses/offer.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { assignOfferServiceSchema } from "@/schema/offers/schema.offer";
import { assertCanManageOfferBranch } from "./offer.admin-guards";
import { handleOfferError } from "./offer.errors";
import {
  assertOfferServices,
  loadManageableOffer,
} from "./offer.service-guards";
import { parseOfferBody, requireOfferAdmin } from "./offer.shared";

/**
 * Handles admin offer-service assignment and returns the refreshed offer.
 */
export async function handleAssignOfferService(
  request: Request,
  offerId: string,
) {
  const auth = await requireOfferAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseOfferBody(request, assignOfferServiceSchema);
  if (body.error) return body.error;

  try {
    const current = await loadManageableOffer(offerId);
    assertCanManageOfferBranch(auth.session.user, current.branchId);
    await assertOfferServices([body.data.serviceId], current.branchId);
    const offer = await getDb().offer.update({
      data: {
        services: {
          upsert: {
            create: body.data,
            update: {},
            where: {
              offerId_serviceId: { offerId, serviceId: body.data.serviceId },
            },
          },
        },
      },
      select: offerSelect(),
      where: { id: offerId },
    });
    return offerJson({
      code: OFFER_CODES.OFFER_SERVICE_ASSIGNED,
      data: { offer: toPublicOffer(offer) },
      message: OFFER_MESSAGES.OFFER_SERVICE_ASSIGNED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    return handleOfferError(error, {
      code: OFFER_CODES.OFFER_SERVICE_ASSIGN_FAILED,
      handler: "handleAssignOfferService",
      message: OFFER_MESSAGES.OFFER_SERVICE_ASSIGN_FAILED,
    });
  }
}

/**
 * Handles admin offer-service removal for one restricted service.
 */
export async function handleRemoveOfferService(
  request: Request,
  offerId: string,
  serviceId: string,
) {
  const auth = await requireOfferAdmin(request);
  if (!auth.success) return auth.error;

  try {
    const current = await loadManageableOffer(offerId);
    assertCanManageOfferBranch(auth.session.user, current.branchId);
    await getDb().offerService.delete({
      where: { offerId_serviceId: { offerId, serviceId } },
    });
    return offerJson({
      code: OFFER_CODES.OFFER_SERVICE_REMOVED,
      data: { offerId, serviceId },
      message: OFFER_MESSAGES.OFFER_SERVICE_REMOVED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleOfferError(error, {
      code: OFFER_CODES.OFFER_SERVICE_REMOVE_FAILED,
      handler: "handleRemoveOfferService",
      message: OFFER_MESSAGES.OFFER_SERVICE_REMOVE_FAILED,
    });
  }
}
