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
      `/login?redirect=${encodeURIComponent(routes.salonStaffManage(slug))}`,
    );
  }

  let salon;
  let staff;
  try {
    [salon, staff] = await Promise.all([
      getSalonForServiceManagement(slug, user.id),
      listStaff(user.id, slug, { limit: 50 }),
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
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="space-y-3">
        <Link
          href={routes.salonManage(slug)}
          className="text-sm text-primary underline"
        >
          Back to manage
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-semibold">Staff</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {salon.name} · {staff.items.length} member
              {staff.items.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </header>

      <section className="mt-6">
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
            href={`${routes.salonStaffManage(slug)}?cursor=${encodeURIComponent(staff.nextCursor)}`}
          >
            View more
          </Link>
        </div>
      ) : null}
    </main>
  );
}
