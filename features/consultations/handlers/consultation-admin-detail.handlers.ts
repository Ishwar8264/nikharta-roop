import { getDb } from "@/db";
import {
  CONSULTATION_CODES,
  CONSULTATION_MESSAGES,
} from "@/features/consultations/constants/consultation.constants";
import { toPublicConsultation } from "@/features/consultations/helpers/consultation.mapper";
import { consultationSelect } from "@/features/consultations/helpers/consultation.selectors";
import {
  consultationError,
  consultationJson,
} from "@/features/consultations/responses/consultation.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { handleConsultationError } from "./consultation.errors";
import { assertCanManageConsultationBranch } from "./consultation.guards";
import { requireConsultationAdmin } from "./consultation.shared";

/**
 * Handles admin consultation detail loading.
 */
export async function handleGetAdminConsultation(
  request: Request,
  consultationId: string,
) {
  const auth = await requireConsultationAdmin(request);
  if (!auth.success) return auth.error;
  try {
    const consultation = await getDb().consultation.findUnique({
      select: consultationSelect(),
      where: { id: consultationId },
    });
    if (!consultation) {
      return consultationError({
        code: CONSULTATION_CODES.CONSULTATION_NOT_FOUND,
        message: CONSULTATION_MESSAGES.CONSULTATION_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }
    assertCanManageConsultationBranch(auth.session.user, consultation.branchId);
    return consultationJson({
      code: CONSULTATION_CODES.CONSULTATION_LOADED,
      data: { consultation: toPublicConsultation(consultation) },
      message: CONSULTATION_MESSAGES.CONSULTATION_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleConsultationError(error, {
      code: CONSULTATION_CODES.CONSULTATION_LOAD_FAILED,
      handler: "handleGetAdminConsultation",
      message: CONSULTATION_MESSAGES.CONSULTATION_LOAD_FAILED,
    });
  }
}
