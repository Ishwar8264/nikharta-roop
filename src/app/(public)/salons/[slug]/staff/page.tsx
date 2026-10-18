import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { StaffList } from "@/features/staff/staff-list";
import { getSession } from "@/lib/auth/get-session";
import { listStaff } from "@/server/modules/staff/staff.service";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";

export const metadata: Metadata = {
  title: "Manage staff | Nikharta Roop",
  description:
    "Your salon team — schedules, leave requests, and service skills for every staff member.",
};

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Salon-side staff directory cockpit.
 *
 * Why `getSalonForServiceManagement` (MANAGER+) rather than STAFF+:
 * The directory exposes every staff member's email + schedule + leave
 * counts — that's management-level visibility. STAFF members can still see
 * the public salon page, but the manage surface stays gated.
 *
 * Why the schedule + leaves enrichment lives in `<StaffList>`:
 * The list endpoint returns only `PublicStaffMember` (no schedule / leaves
 * summary). Doing the per-row reads server-side inside `<StaffList>` keeps
 * the page logic linear and avoids shipping the schedule payloads to the
 * browser twice (the detail page re-fetches them anyway).
 */
export default async function ManageStaffPage({ params }: Props) {
  const { slug } = await params;

  const user = await getSession();
  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(routes.salonStaff(slug))}`,
    );
  }

  let salon;
  let staff;
  try {
    [salon, staff] = await Promise.all([
      getSalonForServiceManagement(slug, user.id),
      listStaff(user.id, slug, { limit: 50, role: "STAFF" }),
    ]);
  } catch (error) {
    if (
      error instanceof SalonNotFoundError ||
      error instanceof SalonRoleInsufficientError
    ) {
      notFound();
    }
    throw error;
  }

  return (
    <main className="w-full space-y-3">
      <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <h1 className="text-base font-semibold">Team members</h1>
        <span className="text-sm tabular-nums text-muted-foreground">
          {staff.items.length}{staff.hasMore ? "+" : ""} member{staff.items.length === 1 && !staff.hasMore ? "" : "s"}
        </span>
      </header>

      <section aria-label={`${salon.name} staff`}>
        <StaffList
          staff={staff.items}
          salonSlug={slug}
          viewerId={user.id}
        />
      </section>

      {staff.hasMore && staff.nextCursor ? (
        <div className="mt-8 flex justify-center">
          <Link
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border bg-background px-3.5 text-sm hover:bg-muted"
            href={`${routes.salonStaff(slug)}?cursor=${encodeURIComponent(staff.nextCursor)}`}
          >
            View more
          </Link>
        </div>
      ) : null}
    </main>
  );
}
