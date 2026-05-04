import type { Prisma } from "@prisma/client";

/**
 * Selects staff fields exposed by public and admin staff responses.
 */
export function staffSelect() {
  return {
    bioEn: true,
    bioHi: true,
    branchId: true,
    createdAt: true,
    experienceYears: true,
    id: true,
    isAvailable: true,
    photoUrl: true,
    rating: true,
    services: {
      select: {
        service: {
          select: {
            id: true,
            nameEn: true,
            nameHi: true,
          },
        },
      },
    },
    specialization: true,
    updatedAt: true,
    user: {
      select: {
        id: true,
        name: true,
      },
    },
    workDays: true,
    workEnd: true,
    workStart: true,
  } satisfies Prisma.StaffSelect;
}
