import { api } from "@/lib/api/backend.client";

import type {
  PublicWorkingHours,
  ReplaceWorkingHoursBody,
  WorkingHoursResponse,
} from "./types";

/**
 * Loads the salon's weekly hours. Public — no auth required.
 *
 * Why the client wrapper exists at all when the page already preloaded:
 * The manage form ships as a Client Component so it can mutate via PUT.
 * Keeping the read path in the same module means the form has one typed
 * surface to round-trip its data through, and a future "reset to defaults"
 * affordance can call this without duplicating the URL.
 */
export function getWorkingHoursApi(salonRef: string) {
  return api.get<WorkingHoursResponse>(
    `/salons/${encodeURIComponent(salonRef)}/working-hours`,
  );
}

/**
 * Replaces the entire 7-day weekly schedule. MANAGER+.
 *
 * Why a PUT, not PATCH:
 * The server treats the week as one atomic unit — sending all 7 days every
 * save keeps the client simple and lets the server enforce the
 * "closeTime > openTime" invariant across the whole set inside a single
 * transaction. Partial updates would require per-row diffing and a separate
 * "add a day" call, which is more rope than the schedule editor needs.
 */
export function replaceWorkingHoursApi(
  salonRef: string,
  body: ReplaceWorkingHoursBody,
) {
  return api.put<WorkingHoursResponse>(
    `/salons/${encodeURIComponent(salonRef)}/working-hours`,
    body,
  );
}

export type { PublicWorkingHours, ReplaceWorkingHoursBody };
