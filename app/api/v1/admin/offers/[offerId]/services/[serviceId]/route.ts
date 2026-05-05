import { handleRemoveOfferService } from "@/features/offers/handlers/offer.handlers";

export const runtime = "nodejs";

type AdminOfferServiceRouteContext = {
  params: Promise<{ offerId: string; serviceId: string }>;
};

/**
 * Routes admin offer-service removal requests to the offers feature handler.
 */
export async function DELETE(
  request: Request,
  context: AdminOfferServiceRouteContext,
) {
  const { offerId, serviceId } = await context.params;
  return handleRemoveOfferService(request, offerId, serviceId);
}
