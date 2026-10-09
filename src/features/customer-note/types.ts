import type { CustomerNote } from "./api";

export type { CustomerNote } from "./api";

/**
 * Props for the staff-facing customer notes timeline.
 *
 * `currentUserRole` is the salon-scoped role of the viewer (OWNER / MANAGER /
 * STAFF), used to gate delete permissions: the author or any MANAGER+ may
 * delete a note. A loose `string` is allowed so it can flow straight from the
 * salon service's `SalonMemberRole` enum without re-narrowing here.
 */
export interface NotesTimelineProps {
  salonSlug: string;
  customerId: string;
  initial: CustomerNote[];
  currentUserId: string;
  currentUserRole: "OWNER" | "MANAGER" | "STAFF" | (string & {});
}
