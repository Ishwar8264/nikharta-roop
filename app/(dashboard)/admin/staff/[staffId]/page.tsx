/**
 * Purpose: Admin staff detail route for managing one staff profile.
 * Responsibilities: load profile details, branch-scoped service options, and render assignment controls.
 * Important notes: this page prepares staff-service data needed by booking availability.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { StaffCard } from "@/components/staff/staff-card";
import { Button } from "@/components/ui/button";
import { StaffServiceAssignment } from "@/features/staff/components/staff-service-assignment";
import {
  getAdminStaff,
  listStaffServiceOptions,
} from "@/features/staff/queries/staff.query";

type AdminStaffDetailPageProps = {
  params: Promise<{ staffId: string }>;
};

/**
 * Renders a staff detail page with service assignment management.
 */
export default async function AdminStaffDetailPage({
  params,
}: AdminStaffDetailPageProps) {
  const { staffId } = await params;
  const [{ error, staff }, serviceOptions] = await Promise.all([
    getAdminStaff(staffId),
    listStaffServiceOptions(),
  ]);

  if (!staff) {
    if (!error) notFound();

    return (
      <section className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <BackButton />
        <p className="text-sm text-destructive">{error}</p>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <BackButton />

      <div>
        <p className="text-sm font-medium text-rose-700">Staff</p>
        <h1 className="font-heading text-2xl font-semibold">
          Manage staff services
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign branch services to this staff profile before slot wiring.
        </p>
      </div>

      <StaffCard
        branch={`${staff.branch.nameHi}, ${staff.branch.city}`}
        experience={formatExperience(staff.experienceYears)}
        isAvailable={staff.isAvailable}
        name={staff.name ?? "Unnamed staff"}
        photoUrl={staff.photoUrl}
        services={staff.services.map((service) => service.nameHi)}
        specialization={staff.specialization.join(", ")}
        workHours={`${staff.workStart.slice(0, 5)} - ${staff.workEnd.slice(0, 5)}`}
      />

      <StaffServiceAssignment serviceOptions={serviceOptions} staff={staff} />
    </section>
  );
}

/**
 * Renders a stable back link to the staff list.
 */
function BackButton() {
  return (
    <Button asChild className="-ml-2 w-fit" size="sm" variant="ghost">
      <Link href="/admin/staff">
        <ArrowLeft className="size-4" />
        Back
      </Link>
    </Button>
  );
}

/**
 * Formats optional experience into compact detail text.
 */
function formatExperience(experienceYears: number | null) {
  if (experienceYears === null) return undefined;

  return `${experienceYears} year${experienceYears === 1 ? "" : "s"} experience`;
}
