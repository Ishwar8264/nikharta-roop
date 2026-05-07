import { getDb } from "@/db";
import {
  ADMIN_PAYMENT_CODES,
  ADMIN_PAYMENT_MESSAGES,
} from "@/features/admin-payments/constants/admin-payment.constants";
import { toPublicAdminPayment } from "@/features/admin-payments/helpers/admin-payment.mapper";
import { adminPaymentSelect } from "@/features/admin-payments/helpers/admin-payment.selectors";
import { adminPaymentJson } from "@/features/admin-payments/responses/admin-payment.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { listAdminPaymentsQuerySchema } from "@/schema/admin-payments/schema.admin-payment";
import { handleAdminPaymentError, throwAdminPaymentNotFound } from "./admin-payment.errors";
import { resolveAdminPaymentBranch } from "./admin-payment.scopes";
import { parseAdminPaymentQuery, requireAdminPaymentActor } from "./admin-payment.shared";

/**
 * Handles admin payment listing requests.
 */
export async function handleListAdminPayments(request: Request) {
  const auth = await requireAdminPaymentActor(request);
  if (!auth.success) return auth.error;
  const query = parseAdminPaymentQuery(request, listAdminPaymentsQuerySchema);
  if (!query.success) return query.error;
  try {
    const branchId = resolveAdminPaymentBranch(query.data.branchId, auth.session.user);
    const payments = await getDb().payment.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: adminPaymentSelect(),
      take: query.data.limit,
      where: {
        booking: branchId ? { branchId } : undefined,
        bookingId: query.data.bookingId,
        createdAt: paymentDateRange(query.data),
        provider: query.data.provider,
        status: query.data.status,
        userId: query.data.userId,
      },
    });
    return adminPaymentJson({
      code: ADMIN_PAYMENT_CODES.PAYMENT_LISTED,
      data: { payments: payments.map(toPublicAdminPayment), limit: query.data.limit },
      message: ADMIN_PAYMENT_MESSAGES.PAYMENT_LISTED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleAdminPaymentError(error, {
      code: ADMIN_PAYMENT_CODES.PAYMENT_LOAD_FAILED,
      handler: "handleListAdminPayments",
      message: ADMIN_PAYMENT_MESSAGES.PAYMENT_LOAD_FAILED,
    });
  }
}

/**
 * Handles admin payment detail requests.
 */
export async function handleGetAdminPayment(request: Request, paymentId: string) {
  const auth = await requireAdminPaymentActor(request);
  if (!auth.success) return auth.error;
  try {
    const payment = await getDb().payment.findFirst({
      select: adminPaymentSelect(),
      where: {
        id: paymentId,
        booking:
          auth.session.user.role === "SUPER_ADMIN"
            ? undefined
            : { branchId: auth.session.user.branchId ?? "" },
      },
    });
    if (!payment) throwAdminPaymentNotFound();
    return adminPaymentJson({
      code: ADMIN_PAYMENT_CODES.PAYMENT_LOADED,
      data: { payment: toPublicAdminPayment(payment) },
      message: ADMIN_PAYMENT_MESSAGES.PAYMENT_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleAdminPaymentError(error, {
      code: ADMIN_PAYMENT_CODES.PAYMENT_LOAD_FAILED,
      handler: "handleGetAdminPayment",
      message: ADMIN_PAYMENT_MESSAGES.PAYMENT_LOAD_FAILED,
    });
  }
}

/**
 * Builds optional payment created-at range filters.
 */
function paymentDateRange(input: { from?: string; to?: string }) {
  return {
    gte: input.from ? new Date(`${input.from}T00:00:00.000Z`) : undefined,
    lte: input.to ? new Date(`${input.to}T23:59:59.999Z`) : undefined,
  };
}
