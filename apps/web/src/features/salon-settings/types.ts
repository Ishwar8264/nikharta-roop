import type { SalonSettings } from "./api";

export type { SalonSettings, UpdateSettingsBody } from "./api";

/** Props for the salon settings client form. */
export interface SettingsFormProps {
  salonSlug: string;
  initial: SalonSettings;
  /** True when viewerRole is MANAGER or OWNER; STAFF viewers get a read-only form. */
  canEdit: boolean;
}
