/**
 * Purpose: Admin staff overview list.
 * Responsibilities: render staff cards with branch, availability, hours, experience, and assigned services.
 * Important notes: empty state explains when no staff profiles are in the current admin scope.
 */
import { StaffCard } from "@/components/staff/staff-card";
import type { PublicStaff } from "@/features/staff/types/staff.types";

type AdminStaffListProps = {
  staff: PublicStaff[];
};

/**
 * Renders staff visible to the authenticated admin.
 */
export function AdminStaffList({ staff }: AdminStaffListProps) {
  if (staff.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-stone-300 bg-white p-6 text-sm text-muted-foreground">
        No staff profiles are available for your admin scope yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {staff.map((member) => (
        <StaffCard
          branch={`${member.branch.nameHi}, ${member.branch.city}`}
          experience={formatExperience(member.experienceYears)}
          isAvailable={member.isAvailable}
          key={member.id}
          name={member.name ?? "Unnamed staff"}
          photoUrl={member.photoUrl}
          services={member.services.map((service) => service.nameHi)}
          specialization={member.specialization.join(", ")}
          workHours={`${member.workStart.slice(0, 5)} - ${member.workEnd.slice(0, 5)}`}
        />
      ))}
    </div>
  );
}

/**
 * Formats optional experience into compact card text.
 */
function formatExperience(experienceYears: number | null) {
  if (experienceYears === null) return undefined;

  return `${experienceYears} year${experienceYears === 1 ? "" : "s"} experience`;
}
