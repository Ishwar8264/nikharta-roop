import "server-only";

import { findUserSummaryById } from "./users.repository";
import type { PublicCustomerSummary } from "./users.types";

/**
 * Loads a customer's summary for a staff-facing view.
 *
 * Why no auth check here:
 * The caller is a server page that has already gated on salon membership
 * (e.g. `getSalonForServiceManagement` returns `SalonRoleInsufficientError`
 * for non-staff). Adding a second role check here would either duplicate that
 * work or require re-fetching the salon — and the function takes only the
 * `userId`, with no salon context. Keeping this layer a thin projection keeps
 * it reusable for any future staff surface that has already established
 * access. Returns `null` when the user does not exist or has been soft
 * deleted so the caller can fall back to a truncated-id label.
 */
export async function getCustomerSummary(
  userId: string,
): Promise<PublicCustomerSummary | null> {
  return findUserSummaryById(userId);
}
