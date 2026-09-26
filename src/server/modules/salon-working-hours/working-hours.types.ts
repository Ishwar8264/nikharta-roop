import type { z } from "zod";

import type { DayOfWeek } from "@/generated/prisma/client";

import type { replaceWorkingHoursSchema } from "./working-hours.schema";

export type ReplaceWorkingHoursInput = z.infer<
  typeof replaceWorkingHoursSchema
>;

/** Public shape of one day of a salon's weekly hours. */
export interface PublicWorkingHours {
  id: string;
  day: DayOfWeek;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}
