import "server-only";

import { assertRoleAtLeast } from "@/server/modules/salon/salon.authorization";
import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";
import { findSalonForViewer } from "@/server/modules/salon/salon.repository";
import { resolveSalonId } from "@/server/modules/service/service.repository";

import {
  findOrCreateSettings,
  updateSettings,
} from "./salon-settings.repository";
import type {
  PublicSalonSettings,
  UpdateSalonSettingsInput,
} from "./salon-settings.types";

/** Normalizes the Prisma Decimal no-show fee to a plain number at the API boundary. */
function toPublicSettings(row: {
  salonId: string;
  bufferMinutes: number;
  advanceBookingDays: number;
  cancellationWindowHours: number;
  noShowFee: { toNumber(): number } | number | null;
  acceptsAdvancePayments: boolean;
  walkInsAllowed: boolean;
}): PublicSalonSettings {
  return {
    ...row,
    noShowFee: row.noShowFee === null ? null : Number(row.noShowFee),
  };
}

/** Loads a salon for a settings operation with a minimum role. */
async function loadSalonWithRole(
  callerId: string,
  salonRef: string,
  minimumRole: "STAFF" | "MANAGER",
) {
  const salonId = await resolveSalonId(salonRef);
  if (!salonId) throw new SalonNotFoundError();

  const salon = await findSalonForViewer({ salonId, userId: callerId });
  if (!salon) throw new SalonNotFoundError();

  assertRoleAtLeast(salon.viewerRole, minimumRole);
  return salonId;
}

/** Returns the salon's booking settings. Any member (STAFF+) can read. */
export async function getSalonSettings(
  callerId: string,
  salonRef: string,
): Promise<PublicSalonSettings> {
  const salonId = await loadSalonWithRole(callerId, salonRef, "STAFF");
  return toPublicSettings(await findOrCreateSettings(salonId));
}

/** Updates the salon's booking settings. MANAGER+. */
export async function updateSalonSettings(
  callerId: string,
  salonRef: string,
  input: UpdateSalonSettingsInput,
): Promise<PublicSalonSettings> {
  const salonId = await loadSalonWithRole(callerId, salonRef, "MANAGER");
  await findOrCreateSettings(salonId);

  const data: Record<string, unknown> = {};
  if (input.bufferMinutes !== undefined) {
    data.bufferMinutes = input.bufferMinutes;
  }
  if (input.advanceBookingDays !== undefined) {
    data.advanceBookingDays = input.advanceBookingDays;
  }
  if (input.cancellationWindowHours !== undefined) {
    data.cancellationWindowHours = input.cancellationWindowHours;
  }
  if (input.noShowFee !== undefined) data.noShowFee = input.noShowFee;
  if (input.acceptsAdvancePayments !== undefined) {
    data.acceptsAdvancePayments = input.acceptsAdvancePayments;
  }
  if (input.walkInsAllowed !== undefined) {
    data.walkInsAllowed = input.walkInsAllowed;
  }

  return toPublicSettings(await updateSettings(salonId, data));
}
