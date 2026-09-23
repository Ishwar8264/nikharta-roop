import "server-only";

import type { DayOfWeek } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Loads the full weekly hours for a salon.
 *
 * Why:
 * Ordered by day so the API contract is stable regardless of insertion order.
 */
export async function getWorkingHours(salonId: string) {
  return prisma.salonWorkingHours.findMany({
    where: { salonId },
    orderBy: { day: "asc" },
    select: {
      id: true,
      day: true,
      openTime: true,
      closeTime: true,
      isClosed: true,
    },
  });
}

/**
 * Replaces the entire weekly hours in a single transaction.
 *
 * Why:
 * Delete-all-then-insert keeps the client contract simple (send 7 days, get
 * 7 days) and avoids drift from partial updates. The transaction ensures the
 * salon is never left without hours if the insert half fails.
 */
export async function replaceWorkingHours(
  salonId: string,
  days: Array<{
    day: DayOfWeek;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
  }>,
): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    await transaction.salonWorkingHours.deleteMany({ where: { salonId } });

    if (days.length > 0) {
      await transaction.salonWorkingHours.createMany({
        data: days.map((day) => ({
          salonId,
          day: day.day,
          openTime: day.openTime ?? "00:00",
          closeTime: day.closeTime ?? "00:00",
          isClosed: day.isClosed,
        })),
      });
    }
  });
}
