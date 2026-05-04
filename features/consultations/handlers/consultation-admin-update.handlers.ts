import { getDb } from "@/db";
import {
  CONSULTATION_CODES,
  CONSULTATION_MESSAGES,
} from "@/features/consultations/constants/consultation.constants";
import { toConsultationUpdateData } from "@/features/consultations/helpers/consultation.data";
import { toPublicConsultation } from "@/features/consultations/helpers/consultation.mapper";
import { consultationSelect } from "@/features/consultations/helpers/consultation.selectors";
import { consultationJson } from "@/features/consultations/responses/consultation.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { updateConsultationSchema } from "@/schema/consultations/schema.consultation";
import { handleConsultationError } from "./consultation.errors";
import {
  assertCanManageConsultationBranch,
  assertConsultationRelations,
} from "./consultation.guards";
import {
  ConsultationVisibleError,
  parseConsultationBody,
  requireConsultationAdmin,
} from "./consultation.shared";

/**
 * Handles admin consultation updates.
 */
export async function handleUpdateAdminConsultation(
  request: Request,
  consultationId: string,
) {
  const auth = await requireConsultationAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseConsultationBody(request, updateConsultationSchema);
  if (body.error) return body.error;

  try {
    const current = await loadConsultation(consultationId);
    assertCanManageConsultationBranch(auth.session.user, current.branchId);
    const branchId = body.data.branchId ?? current.branchId;
    assertCanManageConsultationBranch(auth.session.user, branchId);
    await assertConsultationRelations({
      branchId,
      packageId: body.data.packageId ?? current.packageId ?? undefined,
      staffId: body.data.staffId ?? current.staffId ?? undefined,
    });
    const consultation = await getDb().consultation.update({
      data: toConsultationUpdateData(body.data),
      select: consultationSelect(),
      where: { id: consultationId },
    });
    return consultationJson({
      code: CONSULTATION_CODES.CONSULTATION_UPDATED,
      data: { consultation: toPublicConsultation(consultation) },
      message: CONSULTATION_MESSAGES.CONSULTATION_UPDATED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleConsultationError(error, {
      code: CONSULTATION_CODES.CONSULTATION_UPDATE_FAILED,
      handler: "handleUpdateAdminConsultation",
      message: CONSULTATION_MESSAGES.CONSULTATION_UPDATE_FAILED,
    });
  }
}

async function loadConsultation(consultationId: string) {
  const consultation = await getDb().consultation.findUnique({
    select: { branchId: true, id: true, packageId: true, staffId: true },
    where: { id: consultationId },
  });
  if (!consultation) {
    throw new ConsultationVisibleError(
      CONSULTATION_CODES.CONSULTATION_NOT_FOUND,
      CONSULTATION_MESSAGES.CONSULTATION_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
    );
  }
  return consultation;
}
