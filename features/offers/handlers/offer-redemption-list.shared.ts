import { z } from "zod";

import { OFFER_CODES, OFFER_MESSAGES } from "@/features/offers/constants/offer.constants";
import type { OfferRedemptionRow } from "@/features/offers/helpers/offer.mapper";
import { toPublicOfferRedemption } from "@/features/offers/helpers/offer.mapper";
import { offerError, offerJson } from "@/features/offers/responses/offer.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";

/**
 * Parses offer redemption query strings with feature-owned validation errors.
 */
export function parseOfferRedemptionQuery<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const parsed = schema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (parsed.success) {
    return { data: parsed.data as z.output<TSchema>, success: true as const };
  }
  return {
    error: offerError({
      code: OFFER_CODES.VALIDATION_ERROR,
      message: OFFER_MESSAGES.VALIDATION_ERROR,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    }),
    success: false as const,
  };
}

/**
 * Wraps offer redemption collections in the shared response shape.
 */
export function offerRedemptionListResponse(
  redemptions: OfferRedemptionRow[],
  limit: number,
) {
  return offerJson({
    code: OFFER_CODES.OFFER_REDEMPTIONS_LISTED,
    data: { limit, redemptions: redemptions.map(toPublicOfferRedemption) },
    message: OFFER_MESSAGES.OFFER_REDEMPTIONS_LISTED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}
