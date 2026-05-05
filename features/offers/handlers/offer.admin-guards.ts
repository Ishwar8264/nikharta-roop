import { getDb } from "@/db";
import {
  OFFER_CODES,
  OFFER_MESSAGES,
} from "@/features/offers/constants/offer.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { OfferVisibleError, type OfferAdminUser } from "./offer.shared";

/**
 * Branch admins stay limited to their branch; super admins can manage global offers.
 */
export function assertCanManageOfferBranch(
  admin: OfferAdminUser,
  branchId: string | null,
) {
  if (admin.role === "SUPER_ADMIN" || (branchId && admin.branchId === branchId)) {
    return;
  }
  throw new OfferVisibleError(
    OFFER_CODES.FORBIDDEN,
    OFFER_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}

/**
 * Resolves the effective branch scope for admin create/update requests.
 */
export function resolveOfferBranchId(
  requestedBranchId: string | undefined,
  admin: OfferAdminUser,
) {
  if (admin.role === "SUPER_ADMIN") return requestedBranchId ?? null;
  if (
    !admin.branchId ||
    (requestedBranchId && requestedBranchId !== admin.branchId)
  ) {
    throw new OfferVisibleError(
      OFFER_CODES.FORBIDDEN,
      OFFER_MESSAGES.FORBIDDEN,
      HTTP_STATUS.FORBIDDEN,
    );
  }
  return admin.branchId;
}

/**
 * Verifies branch-scoped offers point to an active branch.
 */
export async function assertActiveOfferBranch(branchId: string | null) {
  if (!branchId) return;
  const branch = await getDb().branch.findFirst({
    select: { id: true },
    where: { id: branchId, isActive: true },
  });
  if (!branch) {
    throw new OfferVisibleError(
      OFFER_CODES.BRANCH_NOT_FOUND,
      OFFER_MESSAGES.BRANCH_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
    );
  }
}
