import { handleAssignOfferService } from "@/features/offers/handlers/offer.handlers";

export const runtime = "nodejs";

type AdminOfferServiceRouteContext = {
  params: Promise<{ offerId: string }>;
};

/**
 * Routes admin offer-service assignment requests to the offers feature handler.
 */
export async function POST(
  request: Request,
  context: AdminOfferServiceRouteContext,
) {
  const { offerId } = await context.params;
  return handleAssignOfferService(request, offerId);
}
