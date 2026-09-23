import "server-only";

import { assertRoleAtLeast } from "@/server/modules/salon/salon.authorization";
import { findSalonForViewer } from "@/server/modules/salon/salon.repository";
import { resolveSalonId } from "@/server/modules/service/service.repository";

import { WorkingHoursSalonNotFoundError } from "./working-hours.errors";
import {
  getWorkingHours,
  replaceWorkingHours,
} from "./working-hours.repository";
import type {
  PublicWorkingHours,
  ReplaceWorkingHoursInput,
} from "./working-hours.types";

/**
 * Public read of a salon's weekly hours.
 *
 * Why:
 * Anonymous visitors need to see opening hours before they sign up. Only the
 * active salon's existence is validated; the hours themselves can be empty
 * for a new salon that has not configured them yet.
 */
export async function getSalonWorkingHours(
  salonRef: string,
): Promise<PublicWorkingHours[]> {
  const salonId = await resolveSalonId(salonRef, true);
  if (!salonId) throw new WorkingHoursSalonNotFoundError();

  return getWorkingHours(salonId);
}

/**
 * Replaces a salon's weekly hours.
 *
 * Why:
 * MANAGER+ only. Hours affect every booking on the calendar, so the
 * operations team owns them — the same rationale as staff schedules.
 */
export async function replaceSalonWorkingHours(
  callerId: string,
  salonRef: string,
  input: ReplaceWorkingHoursInput,
): Promise<PublicWorkingHours[]> {
  const salonId = await resolveSalonId(salonRef);
  if (!salonId) throw new WorkingHoursSalonNotFoundError();

  const salon = await findSalonForViewer({ salonId, userId: callerId });
  if (!salon) throw new WorkingHoursSalonNotFoundError();
  assertRoleAtLeast(salon.viewerRole, "MANAGER");

  await replaceWorkingHours(
    salonId,
    input.days.map((day) => ({
      day: day.day,
      openTime: day.openTime ?? null,
      closeTime: day.closeTime ?? null,
      isClosed: day.isClosed,
    })),
  );

  return getWorkingHours(salonId);
}
