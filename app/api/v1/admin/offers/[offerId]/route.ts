import { handleUpdateAdminOffer } from "@/features/offers/handlers/offer.handlers";

export const runtime = "nodejs";

type AdminOfferRouteContext = {
  params: Promise<{ offerId: string }>;
};

/**
 * Routes admin offer patch requests to the offers feature handler.
 */
export async function PATCH(request: Request, context: AdminOfferRouteContext) {
  const { offerId } = await context.params;
  return handleUpdateAdminOffer(request, offerId);
}
