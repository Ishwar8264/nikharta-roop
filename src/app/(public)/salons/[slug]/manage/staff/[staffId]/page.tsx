import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/config/routes";
import { StaffDetailPanel } from "@/features/staff/staff-detail-panel";
import type { StaffServiceOption } from "@/features/staff/types";
import { getSession } from "@/lib/auth/get-session";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";
import { listManagedSalonServices } from "@/server/modules/service/service.service";
import {
  StaffNotFoundError,
  StaffRoleInsufficientError,
} from "@/server/modules/staff/staff.errors";
import {
  getSchedule,
  getSkills,
  getStaffDetail,
  listLeaves,
} from "@/server/modules/staff/staff.service";

export const metadata: Metadata = {
  title: "Manage staff member | Nikharta Roop",
};

interface Props {
  params: Promise<{ slug: string; staffId: string }>;
}

/**
 * Loads one staff member + their schedule, leaves, skills, and the salon's
 * services (for the Skills picker) in parallel, then renders the detail
 * panel.
 *
 * Why `getStaffDetail` does NOT include schedule / leaves / skills:
 * The service deliberately returns only `PublicStaffMember` — the schedule /
 * leaves / skills reads each run their own role + self check (`MANAGER+ or
 * self`), and pulling them in one go would couple four role assertions.
 * Fetching them in parallel here keeps the page render at one round trip
 * while letting the service retain its per-resource access rules.
 *
 * Why `listManagedSalonServices` (not the public `listSalonServices`):
 * The Skills picker shows inactive services too, so a manager can assign a
 * skill to a service that's temporarily off-season. The public list
 * excludes inactive rows, so the picker would miss them.
 */
export default async function ManageStaffDetailPage({ params }: Props) {
  const { slug, staffId } = await params;

  const user = await getSession();
  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(routes.salonStaffDetail(slug, staffId))}`,
    );
  }

  let salon;
  let staff;
  let schedule;
  let leaves;
  let skills;
  let servicesResult;
  try {
    [
      salon,
      staff,
      schedule,
      leaves,
      skills,
      servicesResult,
    ] = await Promise.all([
      getSalonForServiceManagement(slug, user.id),
      getStaffDetail(user.id, slug, staffId),
      getSchedule(user.id, slug, staffId),
      listLeaves(user.id, slug, staffId),
      getSkills(user.id, slug, staffId),
      listManagedSalonServices(user.id, slug),
    ]);
  } catch (error) {
    if (
      error instanceof SalonNotFoundError ||
      error instanceof SalonRoleInsufficientError ||
      error instanceof StaffNotFoundError ||
      error instanceof StaffRoleInsufficientError
    ) {
      notFound();
    }
    throw error;
  }

  const services: StaffServiceOption[] = servicesResult.items.map((service) => ({
    id: service.id,
    name: service.name,
    slug: service.slug,
    isActive: service.isActive,
  }));

  const staffName = staff.user.name ?? "Unnamed member";
  const initial = (staff.user.name?.trim()[0] ?? "?").toUpperCase();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="space-y-3">
        <div className="flex items-start gap-4">
          <Avatar size="lg">
            {staff.user.avatar ? (
              <AvatarImage src={staff.user.avatar} alt={staffName} />
            ) : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
                {staffName}
              </h1>
              <RoleBadge role={staff.role} />
            </div>
            {staff.user.email ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {staff.user.email}
              </p>
            ) : null}
            <p className="mt-1 text-sm text-muted-foreground">{salon.name}</p>
          </div>
        </div>
      </header>

      <section className="mt-6">
        <StaffDetailPanel
          salonSlug={slug}
          staffId={staffId}
          staff={staff}
          schedule={schedule}
          leaves={leaves.items}
          skills={skills}
          services={services}
          viewerRole={salon.viewerRole}
          salonTimezone={salon.timezone}
          viewerId={user.id}
        />
      </section>
    </main>
  );
}

/** Pill coloured by salon role so the hierarchy reads at a glance. */
function RoleBadge({ role }: { role: "OWNER" | "MANAGER" | "STAFF" }) {
  const variant =
    role === "OWNER" ? "default" : role === "MANAGER" ? "secondary" : "outline";
  const label =
    role === "OWNER" ? "Owner" : role === "MANAGER" ? "Manager" : "Staff";
  return (
    <Badge variant={variant} className="uppercase">
      {label}
    </Badge>
  );
}
