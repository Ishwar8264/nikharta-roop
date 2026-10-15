import Link from "next/link";
import { ArrowLeft, Mail, Store } from "lucide-react";
import { CoverImage } from "@/components/shared/cover-image";
import { findSalonMemberBySlug } from "@/server/modules/salon/salon.repository";
import { isResourceId } from "@/server/modules/salon/salon.helpers";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/config/routes";
import { StaffVerificationNotice } from "@/features/staff/staff-verification-notice";
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
  const { slug, staffId: staffRef } = await params;
  let staffId = staffRef;

  const user = await getSession();
  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(routes.salonStaffDetail(slug, staffRef))}`,
    );
  }

  let salon;
  let staff;
  let schedule;
  let leaves;
  let skills;
  let servicesResult;
  try {
    salon = await getSalonForServiceManagement(slug, user.id);
    if (!isResourceId(staffRef)) {
      const member = await findSalonMemberBySlug(salon.id, staffRef);
      if (!member) notFound();
      staffId = member.id;
    }
    [
      staff,
      schedule,
      leaves,
      skills,
      servicesResult,
    ] = await Promise.all([
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

  const staffName = staff.name ?? staff.user.name ?? "Unnamed member";
  const initial = ((staff.name ?? staff.user.name)?.trim()[0] ?? "?").toUpperCase();

  return (
    <main className="w-full space-y-5">
      <Link href={routes.salonStaff(slug)} className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ArrowLeft className="size-4" aria-hidden="true" /> All staff
      </Link>
      <header className="overflow-hidden rounded-2xl border border-border bg-card">
        {staff.bannerImage ? (
          <CoverImage
            src={staff.bannerImage}
            alt={`${staffName} banner`}
            aspect="auto"
            rounded="none"
            className="h-36 sm:h-48"
            priority
          />
        ) : null}
        <div className="px-4 pb-5 sm:px-6">
          <div className={`relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${staff.bannerImage ? "-mt-8" : "pt-5"}`}>
            <div className="min-w-0">
              <Avatar size="lg" className="size-20 bg-card ring-4 ring-card sm:size-24">
                {(staff.avatar ?? staff.user.avatar) ? (
                  <AvatarImage src={staff.avatar ?? staff.user.avatar ?? undefined} alt={staffName} />
                ) : null}
                <AvatarFallback className="text-2xl">{initial}</AvatarFallback>
              </Avatar>
              <h1 className="mt-3 break-words text-xl font-semibold tracking-tight sm:text-2xl">{staffName}</h1>
              {staff.title ? <p className="mt-1 break-words text-sm text-muted-foreground">{staff.title}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <RoleBadge role={staff.role} />
              <Badge variant="outline" className={staff.user.emailVerified ? "border-success/30 bg-success/10 text-success" : "text-muted-foreground"}>
                {staff.user.emailVerified ? "Email verified" : "Email pending"}
              </Badge>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-5">
            <Link href={routes.salonDetail(slug)} className="inline-flex min-w-0 items-center gap-2 hover:text-foreground">
              <Store className="size-4 shrink-0" aria-hidden="true" />
              <span className="break-words">{salon.name}</span>
            </Link>
            {staff.user.email ? (
              <a href={`mailto:${staff.user.email}`} className="inline-flex min-w-0 items-center gap-2 hover:text-foreground">
                <Mail className="size-4 shrink-0" aria-hidden="true" />
                <span className="break-all">{staff.user.email}</span>
              </a>
            ) : null}
          </div>
          {staff.description ? <p className="mt-4 whitespace-pre-wrap break-words border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">{staff.description}</p> : null}
        </div>
      </header>

      {!staff.user.emailVerified && staff.user.email ? <StaffVerificationNotice email={staff.user.email} /> : null}

      <section aria-label="Staff schedule, leaves, and skills">
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
    <Badge variant={variant} className="font-medium">
      {label}
    </Badge>
  );
}
