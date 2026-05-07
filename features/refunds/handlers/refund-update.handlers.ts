import { RefundStatus } from "@prisma/client";

import { getDb } from "@/db";
import { REFUND_CODES, REFUND_MESSAGES } from "@/features/refunds/constants/refund.constants";
import { refundSelect } from "@/features/refunds/helpers/refund.selectors";
import { toPublicRefund } from "@/features/refunds/helpers/refund.mapper";
import { refundJson } from "@/features/refunds/responses/refund.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { updateRefundSchema, type UpdateRefundInput } from "@/schema/refunds/schema.refund";
import { handleRefundError, throwRefundNotFound } from "./refund.errors";
import { loadManageableRefund } from "./refund.guards";
import {
  applySucceededRefund,
  assertRefundTransition,
  refundUpdateData,
} from "./refund-status.helpers";
import { parseRefundBody, requireRefundAdmin, type RefundAdminUser } from "./refund.shared";

/**
 * Handles admin refund patch requests.
 */
export async function handleUpdateRefund(request: Request, refundId: string) {
  const auth = await requireRefundAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseRefundBody(request, updateRefundSchema);
  if (body.error) return body.error;
  return updateRefund(refundId, body.data, auth.session.user);
}

/**
 * Updates one refund and applies payment totals when it succeeds.
 */
async function updateRefund(
  refundId: string,
  input: UpdateRefundInput,
  admin: RefundAdminUser,
) {
  try {
    const current = await loadManageableRefund(refundId, admin);
    if (!current) throwRefundNotFound();
    assertRefundTransition(current.status, input.status);
    const refund = await getDb().$transaction(async (tx) => {
      if (input.status === RefundStatus.SUCCEEDED && current.status !== RefundStatus.SUCCEEDED) {
        await applySucceededRefund({
          amount: current.amount,
          paymentId: current.paymentId,
          tx,
        });
      }
      return tx.refund.update({
        data: refundUpdateData(input),
        select: refundSelect(),
        where: { id: refundId },
      });
    });
    return refundJson({
      code: REFUND_CODES.REFUND_UPDATED,
      data: { refund: toPublicRefund(refund) },
      message: REFUND_MESSAGES.REFUND_UPDATED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleRefundError(error, {
      code: REFUND_CODES.REFUND_UPDATE_FAILED,
      handler: "updateRefund",
      message: REFUND_MESSAGES.REFUND_UPDATE_FAILED,
    });
  }
}
