import "server-only";

import { prisma } from "@/lib/prisma";

const PUBLIC_SETTINGS_SELECT = {
  salonId: true,
  bufferMinutes: true,
  advanceBookingDays: true,
  cancellationWindowHours: true,
  noShowFee: true,
  acceptsAdvancePayments: true,
  walkInsAllowed: true,
} as const;

/**
 * Loads a salon's settings, creating the row with defaults on first read.
 *
 * Why create-on-read:
 * A salon that never opened its settings page still has valid booking rules.
 * This keeps every caller free of a "row may not exist" branch.
 */
export async function findOrCreateSettings(salonId: string) {
  const existing = await prisma.salonSettings.findUnique({
    where: { salonId },
    select: PUBLIC_SETTINGS_SELECT,
  });
  if (existing) return existing;

  return prisma.salonSettings.create({
    data: { salonId },
    select: PUBLIC_SETTINGS_SELECT,
  });
}

/** Applies a partial update to a salon's settings. */
export async function updateSettings(
  salonId: string,
  data: Record<string, unknown>,
) {
  return prisma.salonSettings.update({
    where: { salonId },
    data,
    select: PUBLIC_SETTINGS_SELECT,
  });
}
