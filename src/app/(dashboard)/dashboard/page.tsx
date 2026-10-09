import type { Metadata } from "next";

import { DashboardHome } from "@/features/dashboard";
import { getSession } from "@/lib/auth/get-session";
import { findOwnedSalonSummary } from "@/server/modules/salon/salon.service";
import { getSalonOwnerStats } from "@/server/modules/salon/salon-stats.service";
import type { SalonOwnerStats } from "@/server/modules/salon/salon-stats.types";
import type { SalonWithViewerRole } from "@/server/modules/salon/salon.types";
import { SalonVerificationNotFoundError } from "@/server/modules/verification/verification.errors";
import { getSalonVerification } from "@/server/modules/verification/verification.service";
import type { PublicSalonVerification } from "@/server/modules/verification/verification.types";

export const metadata: Metadata = {
  title: "Dashboard | Nikharta Roop",
};

/**
 * Customer dashboard home.
 *
 * Why the page is a thin orchestration layer:
 * All presentational JSX lives in `features/dashboard/dashboard-home.tsx`.
 * The page owns the data pipeline — read the session, find the caller's
 * salon summary, fetch that salon's verification row and owner stats — and
 * hands the resolved props to the presentational component. This keeps the
 * RSC boundary obvious: nothing in `features/dashboard/**` touches cookies
 * or the database.
 *
 * Why the `if (!user) return null`:
 * The `(dashboard)/layout.tsx` calls `getSession()` and redirects to
 * `/login` when the cookie is missing. By the time this page renders, the
 * session must exist. TypeScript still narrows `user` to `CurrentUser |
 * null` from the helper's signature, so the guard is a no-op at runtime
 * but a hard requirement for the compiler.
 *
 * Why `SalonVerificationNotFoundError` is collapsed to null:
 * `getSalonVerification` throws when the salon has no verification row
 * yet (a brand-new salon that has never submitted). The dashboard's
 * banner treats "no row" as the info-tone onboarding state, so we
 * collapse that specific typed error to `null` and rethrow anything else.
 *
 * Why stats and verification resolve sequentially after the salon lookup:
 * Both depend on `ownedSalon.slug`. The salon summary is one round trip;
 * once it resolves, the stats fetch (which itself fans out to five
 * parallel reads internally) and the verification lookup start together
 * in `Promise.all`. Failing to find a salon short-circuits both — a
 * customer never pays for owner-only work.
 */
export default async function DashboardPage() {
  const user = await getSession();
  if (!user) return null;

  let ownedSalon: SalonWithViewerRole | null = null;
  let verification: PublicSalonVerification | null = null;
  let stats: SalonOwnerStats | null = null;

  ownedSalon = await findOwnedSalonSummary(user.id);
  if (ownedSalon) {
    [verification, stats] = await Promise.all([
      getSalonVerification(user.id, ownedSalon.slug).catch(
        (error: unknown) => {
          if (error instanceof SalonVerificationNotFoundError) return null;
          throw error;
        },
      ),
      getSalonOwnerStats(user.id),
    ]);
  }

  return (
    <DashboardHome
      user={user}
      ownedSalon={ownedSalon}
      verification={verification}
      stats={stats}
    />
  );
}
