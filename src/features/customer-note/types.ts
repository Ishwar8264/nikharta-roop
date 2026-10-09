import type { CustomerNote } from "./api";

export type { CustomerNote } from "./api";

/**
 * Props for the staff-facing customer notes timeline.
 *
 * `currentUserRole` is the salon-scoped role of the viewer (OWNER / MANAGER /
 * STAFF), used to gate delete permissions: the author or any MANAGER+ may
 * delete a note. A loose `string` is allowed so it can flow straight from the
 * salon service's `SalonMemberRole` enum without re-narrowing here.
 *
 * `customerName` is the resolved display name of the customer the notes are
 * about. When provided, the timeline renders an identifying header (an
 * `Avatar` with the initial fallback + the name) above the composer so staff
 * have orientation. When omitted (e.g. the customer row was soft-deleted or
 * not yet seeded), the header is suppressed and the page subtitle's truncated
 * id carries orientation alone.
 *
 * `customerAvatar` is the optional avatar URL for the same customer. When
 * both `customerName` and `customerAvatar` are provided, the header renders
 * the avatar image with the initial as the fallback (for broken/empty URLs
 * or slow Cloudinary loads).
 */
export interface NotesTimelineProps {
  salonSlug: string;
  customerId: string;
  initial: CustomerNote[];
  currentUserId: string;
  currentUserRole: "OWNER" | "MANAGER" | "STAFF" | (string & {});
  customerName?: string;
  customerAvatar?: string;
}
