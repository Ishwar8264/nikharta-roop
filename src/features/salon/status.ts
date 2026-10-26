import { z } from "zod";

export const SALON_STATUSES = ["DRAFT", "LIVE", "TEMPORARILY_CLOSED", "ARCHIVED"] as const;
export type SalonStatus = (typeof SALON_STATUSES)[number];
export const salonStatusSchema = z.enum(SALON_STATUSES);
export const SALON_STATUS_LABELS: Record<SalonStatus, string> = {
  DRAFT: "Draft", LIVE: "Live", TEMPORARILY_CLOSED: "Temporarily closed", ARCHIVED: "Archived",
};

/** Publication never bypasses the existing verification and suspension gate. */
export const PUBLIC_SALON_FILTER = {
  isActive: true,
  deletedAt: null,
  status: { in: ["LIVE", "TEMPORARILY_CLOSED"] as SalonStatus[] },
};
export const BOOKABLE_SALON_FILTER = { isActive: true, deletedAt: null, status: "LIVE" as const };
