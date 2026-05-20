/**
 * Purpose: Staff-service assignment panel for admin staff detail pages.
 * Responsibilities: show assigned services, expose branch-scoped service assignment, and remove assignments.
 * Important notes: forms submit through server actions that call the existing staff-service APIs.
 */
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  assignStaffServiceFormAction,
  removeStaffServiceAction,
} from "@/features/staff/actions/staff-admin.actions";
import type {
  PublicStaff,
  StaffServiceOption,
} from "@/features/staff/types/staff.types";

type StaffServiceAssignmentProps = {
  serviceOptions: StaffServiceOption[];
  staff: PublicStaff;
};

/**
 * Renders assigned service badges plus a branch-scoped add-service form.
 */
export function StaffServiceAssignment({
  serviceOptions,
  staff,
}: StaffServiceAssignmentProps) {
  const assignedServiceIds = new Set(staff.services.map((service) => service.id));
  const availableServices = serviceOptions.filter(
    (service) =>
      service.branchId === staff.branchId && !assignedServiceIds.has(service.id),
  );
  const assignAction = assignStaffServiceFormAction.bind(null, staff.id);

  return (
    <section className="space-y-4 rounded-md border bg-white p-4">
      <div>
        <h2 className="font-heading text-lg font-semibold">Assigned services</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Link staff to services so booking can filter by branch and service.
        </p>
      </div>

      {staff.services.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {staff.services.map((service) => (
            <form
              action={removeStaffServiceAction.bind(null, staff.id, service.id)}
              key={service.id}
            >
              <Button size="sm" type="submit" variant="outline">
                <Badge variant="secondary">{service.nameHi}</Badge>
                <X className="size-3" />
              </Button>
            </form>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          No services assigned yet.
        </p>
      )}

      <form action={assignAction} className="flex flex-col gap-3 sm:flex-row">
        <select
          className="h-9 flex-1 rounded-lg border border-input bg-transparent px-3 text-sm"
          disabled={availableServices.length === 0}
          name="serviceId"
          required
        >
          <option value="">Select a service</option>
          {availableServices.map((service) => (
            <option key={service.id} value={service.id}>
              {service.nameHi}
            </option>
          ))}
        </select>
        <Button disabled={availableServices.length === 0} type="submit">
          <Plus className="size-4" />
          Assign service
        </Button>
      </form>
    </section>
  );
}
