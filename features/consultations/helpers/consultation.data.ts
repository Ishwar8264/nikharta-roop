import { ConsultationStatus } from "@prisma/client";

import type {
  CreateConsultationInput,
  UpdateConsultationInput,
} from "@/schema/consultations/schema.consultation";

/**
 * Converts user consultation input into Prisma-safe create data.
 */
export function toConsultationCreateData(
  input: CreateConsultationInput,
  userId: string,
) {
  return {
    branchId: input.branchId,
    notes: input.notes ?? null,
    packageId: input.packageId,
    preferredDate: toDateOnly(input.preferredDate),
    preferredTime: toTimeOnly(input.preferredTime),
    staffId: input.staffId,
    status: ConsultationStatus.REQUESTED,
    userId,
  };
}

/**
 * Converts admin consultation input into Prisma-safe update data.
 */
export function toConsultationUpdateData(input: UpdateConsultationInput) {
  return {
    adminNotes: input.adminNotes,
    branchId: input.branchId,
    cancelledAt:
      input.status === undefined
        ? undefined
        : input.status === ConsultationStatus.CANCELLED
          ? new Date()
          : null,
    completedAt:
      input.status === undefined
        ? undefined
        : input.status === ConsultationStatus.COMPLETED
          ? new Date()
          : null,
    packageId: input.packageId,
    preferredDate:
      input.preferredDate === undefined
        ? undefined
        : toDateOnly(input.preferredDate),
    preferredTime:
      input.preferredTime === undefined
        ? undefined
        : toTimeOnly(input.preferredTime),
    staffId: input.staffId,
    status: input.status,
  };
}

export function toDateOnly(value: string | undefined) {
  return value ? new Date(`${value}T00:00:00.000Z`) : undefined;
}

export function toTimeOnly(value: string | undefined) {
  return value ? new Date(`1970-01-01T${normalizeTime(value)}.000Z`) : undefined;
}

function normalizeTime(value: string) {
  return value.length === 5 ? `${value}:00` : value;
}
