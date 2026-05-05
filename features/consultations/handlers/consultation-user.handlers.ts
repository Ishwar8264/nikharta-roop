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
import {
  listMyConsultationsQuerySchema,
  type ListMyConsultationsQueryInput,
} from "@/schema/consultations/schema.consultation";
import { handleConsultationError, validationError } from "./consultation.errors";
import { requireConsultationAuth } from "./consultation.shared";

export async function handleListMyConsultations(request: Request) {
  const auth = await requireConsultationAuth(request);
  if (!auth.success) return auth.error;
  const query = listMyConsultationsQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!query.success) return validationError(query.error.issues[0]?.message);
  return listMyConsultations(auth.session.userId, query.data);
}

export async function handleGetMyConsultation(
  request: Request,
  consultationId: string,
) {
  const auth = await requireConsultationAuth(request);
  if (!auth.success) return auth.error;
  return getMyConsultation(auth.session.userId, consultationId);
}

async function listMyConsultations(
  userId: string,
  input: ListMyConsultationsQueryInput,
) {
  try {
    const consultations = await getDb().consultation.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: consultationSelect(),
      take: input.limit,
      where: { status: input.status, userId },
    });
    return consultationJson({
      code: CONSULTATION_CODES.CONSULTATIONS_LISTED,
      data: {
        consultations: consultations.map(toPublicConsultation),
        limit: input.limit,
      },
      message: CONSULTATION_MESSAGES.CONSULTATIONS_LISTED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleConsultationError(error, {
      code: CONSULTATION_CODES.CONSULTATIONS_LOAD_FAILED,
      handler: "listMyConsultations",
      message: CONSULTATION_MESSAGES.CONSULTATIONS_LOAD_FAILED,
    });
  }
}

async function getMyConsultation(userId: string, consultationId: string) {
  const consultation = await getDb().consultation.findFirst({
    select: consultationSelect(),
    where: { id: consultationId, userId },
  });
  if (!consultation) {
    return consultationError({
      code: CONSULTATION_CODES.CONSULTATION_NOT_FOUND,
      message: CONSULTATION_MESSAGES.CONSULTATION_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    });
  }
  return consultationJson({
    code: CONSULTATION_CODES.CONSULTATION_LOADED,
    data: { consultation: toPublicConsultation(consultation) },
    message: CONSULTATION_MESSAGES.CONSULTATION_LOADED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}
