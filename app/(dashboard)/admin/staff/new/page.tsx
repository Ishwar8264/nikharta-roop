/**
 * Purpose: Admin route for creating a staff profile.
 * Responsibilities: load branches, candidate users, service options, and render the staff form.
 * Important notes: users must exist before they can be promoted into staff profiles.
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAdminBranches } from "@/features/branches/queries/admin-branch.query";
import { createStaffAction } from "@/features/staff/actions/staff-admin.actions";
import { StaffAdminForm } from "@/features/staff/components/staff-admin-form";
import {
  listStaffServiceOptions,
  listStaffUserOptions,
} from "@/features/staff/queries/staff.query";

/**
 * Renders the create staff screen.
 */
export default async function NewAdminStaffPage() {
  const [{ branches, error }, userOptions, serviceOptions] = await Promise.all([
    listAdminBranches(),
    listStaffUserOptions(),
    listStaffServiceOptions(),
  ]);

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <Button asChild className="-ml-2 w-fit" size="sm" variant="ghost">
        <Link href="/admin/staff">
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </Button>

      <Card className="bg-white/85">
        <CardHeader>
          <CardTitle>Create staff</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
          <StaffAdminForm
            action={createStaffAction}
            branches={branches}
            serviceOptions={serviceOptions}
            userOptions={userOptions}
          />
        </CardContent>
      </Card>
    </section>
  );
}
