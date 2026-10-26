import { api } from "@/lib/api/backend.client";

/** Mirrors `PublicSalonSettings`. */
export interface SalonSettings {
  salonId: string;
  bufferMinutes: number;
  advanceBookingDays: number;
  cancellationWindowHours: number;
  noShowFee: number | null;
  acceptsAdvancePayments: boolean;
  walkInsAllowed: boolean;
}

/** Mirrors `UpdateSalonSettingsInput`. */
export interface UpdateSettingsBody {
  bufferMinutes?: number;
  advanceBookingDays?: number;
  cancellationWindowHours?: number;
  noShowFee?: number | null;
  acceptsAdvancePayments?: boolean;
  walkInsAllowed?: boolean;
}

/** Loads the salon's booking settings. Any member (STAFF+). */
export function getSettingsApi(salonRef: string) {
  return api.get<{ message: string; data: { settings: SalonSettings } }>(
    `/salons/${encodeURIComponent(salonRef)}/settings`,
  );
}

/** Updates the salon's booking settings. MANAGER+. */
export function updateSettingsApi(salonRef: string, body: UpdateSettingsBody) {
  return api.patch<{ message: string; data: { settings: SalonSettings } }>(
    `/salons/${encodeURIComponent(salonRef)}/settings`,
    body,
  );
}
