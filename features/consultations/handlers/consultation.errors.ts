import {
  CONSULTATION_CODES,
  CONSULTATION_MESSAGES,
} from "@/features/consultations/constants/consultation.constants";
import { consultationError } from "@/features/consultations/responses/consultation.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { ConsultationVisibleError } from "./consultation.shared";

/**
 * Converts expected consultation failures into user-safe responses.
 */
export function handleConsultationError(
  error: unknown,
  input: { code: string; handler: string; message: string },
) {
  if (error instanceof ConsultationVisibleError) {
    return consultationError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }
  console.error(input.code, { error, handler: input.handler });
  return consultationError({
    code: input.code,
    message: input.message,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

export function validationError(message?: string) {
  return consultationError({
    code: CONSULTATION_CODES.VALIDATION_ERROR,
    message: message ?? CONSULTATION_MESSAGES.VALIDATION_ERROR,
    status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
  });
}
