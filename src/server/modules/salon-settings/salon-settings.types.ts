import type { z } from "zod";

import type { updateSalonSettingsSchema } from "./salon-settings.schema";

export type UpdateSalonSettingsInput = z.infer<
  typeof updateSalonSettingsSchema
>;

/** Settings row returned to salon members. */
export interface PublicSalonSettings {
  salonId: string;
  bufferMinutes: number;
  advanceBookingDays: number;
  cancellationWindowHours: number;
  noShowFee: number | null;
  acceptsAdvancePayments: boolean;
  walkInsAllowed: boolean;
}
