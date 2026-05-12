import type { Prisma } from "@prisma/client";

import { consultationSelect } from "./consultation.selectors";

type ConsultationRow = Prisma.ConsultationGetPayload<{
  select: ReturnType<typeof consultationSelect>;
}>;

/**
 * Converts a consultation row into the public API shape.
 */
export function toPublicConsultation(consultation: ConsultationRow) {
  return {
    adminNotes: consultation.adminNotes,
    branch: consultation.branch ?? null,
    branchId: consultation.branchId,
    cancelledAt: consultation.cancelledAt,
    completedAt: consultation.completedAt,
    createdAt: consultation.createdAt,
    id: consultation.id,
    notes: consultation.notes,
    package: consultation.package,
    packageId: consultation.packageId,
    preferredDate: consultation.preferredDate,
    preferredTime: consultation.preferredTime,
    staff: consultation.staff
      ? { id: consultation.staff.id, name: consultation.staff.user.name }
      : null,
    staffId: consultation.staffId,
    status: consultation.status,
    updatedAt: consultation.updatedAt,
    user: consultation.user ?? null,
    userId: consultation.userId,
  };
}
