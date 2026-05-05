import type { Prisma } from "@prisma/client";

/**
 * Selects consultation fields exposed by user and admin APIs.
 */
export const consultationSelect = () =>
  ({
    adminNotes: true,
    branch: {
      select: { city: true, id: true, nameEn: true, nameHi: true },
    },
    branchId: true,
    cancelledAt: true,
    completedAt: true,
    createdAt: true,
    id: true,
    notes: true,
    package: { select: { id: true, nameEn: true, nameHi: true, slug: true } },
    packageId: true,
    preferredDate: true,
    preferredTime: true,
    staff: { select: { id: true, user: { select: { name: true } } } },
    staffId: true,
    status: true,
    updatedAt: true,
    user: { select: { id: true, mobile: true, name: true } },
    userId: true,
  }) satisfies Prisma.ConsultationSelect;
