/**
 * Purpose: Prisma select helpers for staff API responses.
 * Responsibilities: keep public and admin staff field selection consistent.
 * Important notes: branch and service names are included so UI cards do not need extra lookups.
 */
import type { Prisma } from "@prisma/client";

/**
 * Selects staff fields exposed by public and admin staff responses.
 */
export function staffSelect() {
  return {
    bioEn: true,
    bioHi: true,
    branch: {
      select: {
        city: true,
        id: true,
        nameEn: true,
        nameHi: true,
      },
    },
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
