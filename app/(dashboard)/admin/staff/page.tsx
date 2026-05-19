/**
 * Purpose: Admin Staff route for staff management visibility.
 * Responsibilities: load protected staff data and render branch-linked staff overview.
 * Important notes: staff creation is available from this screen and assignments are seeded during create.
 */
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AdminStaffList } from "@/features/staff/components/admin-staff-list";
import { listAdminStaff } from "@/features/staff/queries/staff.query";

/**
 * Renders the admin staff management overview.
 */
export default async function AdminStaffPage() {
  const { error, staff } = await listAdminStaff({
    limit: 100,
    status: "all",
  });

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-700">Staff</p>
          <h1 className="font-heading text-2xl font-semibold">
            Staff management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review staff profiles, branch assignment, services, working hours,
            and availability.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/staff/new">Create staff</Link>
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <AdminStaffList staff={staff} />
    </section>
  );
}
