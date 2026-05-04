import { getDb } from "@/db";
import {
  CONSULTATION_CODES,
  CONSULTATION_MESSAGES,
} from "@/features/consultations/constants/consultation.constants";
import { toConsultationCreateData } from "@/features/consultations/helpers/consultation.data";
import { toPublicConsultation } from "@/features/consultations/helpers/consultation.mapper";
import { consultationSelect } from "@/features/consultations/helpers/consultation.selectors";
import { consultationJson } from "@/features/consultations/responses/consultation.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { createConsultationSchema } from "@/schema/consultations/schema.consultation";
import { handleConsultationError } from "./consultation.errors";
import { assertConsultationRelations } from "./consultation.guards";
import {
  parseConsultationBody,
  requireConsultationAuth,
} from "./consultation.shared";

/**
 * Handles authenticated consultation request creation.
 */
export async function handleCreateConsultation(request: Request) {
  const auth = await requireConsultationAuth(request);
  if (!auth.success) return auth.error;
  const body = await parseConsultationBody(request, createConsultationSchema);
  if (body.error) return body.error;
  return createConsultation(auth.session.userId, body.data);
}

async function createConsultation(
  userId: string,
  input: Parameters<typeof toConsultationCreateData>[0],
) {
  try {
    await assertConsultationRelations(input);
    const consultation = await getDb().consultation.create({
      data: toConsultationCreateData(input, userId),
      select: consultationSelect(),
    });
    return consultationJson({
      code: CONSULTATION_CODES.CONSULTATION_CREATED,
      data: { consultation: toPublicConsultation(consultation) },
      message: CONSULTATION_MESSAGES.CONSULTATION_CREATED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    return handleConsultationError(error, {
      code: CONSULTATION_CODES.CONSULTATION_CREATE_FAILED,
      handler: "createConsultation",
      message: CONSULTATION_MESSAGES.CONSULTATION_CREATE_FAILED,
    });
  }
}
