import { getDb } from "@/db";
import { LOYALTY_CODES, LOYALTY_MESSAGES } from "@/features/loyalty/constants/loyalty.constants";
import { loyaltyTransactionSelect } from "@/features/loyalty/helpers/loyalty.selectors";
import { loyaltyJson } from "@/features/loyalty/responses/loyalty.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  createLoyaltyTransactionSchema,
  type CreateLoyaltyTransactionInput,
} from "@/schema/loyalty/schema.loyalty";
import { handleLoyaltyError } from "./loyalty.errors";
import {
  assertLoyaltyBookingScope,
  loadManageableLoyaltyUser,
  signedLoyaltyPoints,
  throwInsufficientLoyaltyPoints,
} from "./loyalty.guards";
import { parseLoyaltyBody, requireLoyaltyAdmin, type LoyaltyAdminUser } from "./loyalty.shared";

/**
 * Handles admin-created loyalty transaction requests.
 */
export async function handleCreateAdminLoyaltyTransaction(request: Request) {
  const auth = await requireLoyaltyAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseLoyaltyBody(request, createLoyaltyTransactionSchema);
  if (body.error) return body.error;
  try {
    const transaction = await createLoyaltyTransaction(body.data, auth.session.user);
    return loyaltyJson({
      code: LOYALTY_CODES.TRANSACTION_CREATED,
      data: { transaction },
      message: LOYALTY_MESSAGES.TRANSACTION_CREATED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    return handleLoyaltyError(error, {
      code: LOYALTY_CODES.TRANSACTION_CREATE_FAILED,
      handler: "handleCreateAdminLoyaltyTransaction",
      message: LOYALTY_MESSAGES.TRANSACTION_CREATE_FAILED,
    });
  }
}

/**
 * Creates a signed ledger row and updates the cached user balance atomically.
 */
async function createLoyaltyTransaction(
  input: CreateLoyaltyTransactionInput,
  admin: LoyaltyAdminUser,
) {
  await loadManageableLoyaltyUser(input.userId, admin);
  await assertLoyaltyBookingScope(input.bookingId, input.userId, admin);
  const delta = signedLoyaltyPoints(input.type, input.points);
  return getDb().$transaction(async (tx) => {
    const balanceGuard = delta < 0 ? { loyaltyPoints: { gte: Math.abs(delta) } } : {};
    const updated = await tx.user.updateMany({
      data: { loyaltyPoints: { increment: delta } },
      where: { id: input.userId, ...balanceGuard },
    });
    if (updated.count !== 1) throwInsufficientLoyaltyPoints();
    return tx.loyaltyTransaction.create({
      data: {
        bookingId: input.bookingId,
        expiresAt: input.expiresAt,
        points: delta,
        reasonHi: input.reasonHi,
        type: input.type,
        userId: input.userId,
      },
      select: loyaltyTransactionSelect(),
    });
  });
}
