/**
 * Purpose: Admin route for creating a package.
 * Responsibilities: load branches and active branch services, then render the package create form.
 * Important notes: services must exist before they can be attached to a package.
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAdminBranches } from "@/features/branches/queries/admin-branch.query";
import { createPackageAction } from "@/features/packages/actions/package-admin.actions";
import { PackageAdminForm } from "@/features/packages/components/package-admin-form";
import { listPackageServiceOptions } from "@/features/packages/queries/package.query";

/**
 * Renders the create package screen.
 */
export default async function NewAdminPackagePage() {
  const [{ branches, error }, serviceOptions] = await Promise.all([
    listAdminBranches(),
    listPackageServiceOptions(),
  ]);

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <Button asChild className="-ml-2 w-fit" size="sm" variant="ghost">
        <Link href="/admin/packages">
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </Button>

      <Card className="bg-white/85">
        <CardHeader>
          <CardTitle>Create package</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
          <PackageAdminForm
            action={createPackageAction}
            branches={branches}
            serviceOptions={serviceOptions}
          />
        </CardContent>
      </Card>
    </section>
  );
}
