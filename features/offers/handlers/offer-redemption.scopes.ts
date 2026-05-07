import { OFFER_CODES, OFFER_MESSAGES } from "@/features/offers/constants/offer.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { OfferVisibleError, type OfferAdminUser } from "./offer.shared";

/**
 * Resolves the branch scope allowed for admin redemption list requests.
 */
export function resolveOfferRedemptionBranch(
  requestedBranchId: string | undefined,
  admin: OfferAdminUser,
) {
  if (admin.role === "SUPER_ADMIN") return requestedBranchId;
  if (admin.branchId && (!requestedBranchId || requestedBranchId === admin.branchId)) {
    return admin.branchId;
  }
  throw new OfferVisibleError(
    OFFER_CODES.FORBIDDEN,
    OFFER_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}
