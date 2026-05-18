/**
 * Purpose: Admin route for creating a service category before services are added.
 * Responsibilities: load manageable branches and render the category create form.
 * Important notes: categories can be branch-scoped, which keeps branch-specific catalogs clean.
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ServiceCategoryFormShell } from "@/components/admin/services/service-category-form-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAdminBranches } from "@/features/branches/queries/admin-branch.query";
import { createServiceCategoryAction } from "@/features/services/actions/service-admin.actions";

/**
 * Renders the create category screen.
 */
export default async function NewAdminServiceCategoryPage() {
  const { branches, error } = await listAdminBranches();

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <Button asChild className="-ml-2 w-fit" size="sm" variant="ghost">
        <Link href="/admin/services/new">
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </Button>

      <Card className="bg-white/85">
        <CardHeader>
          <CardTitle>Create service category</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
          <ServiceCategoryFormShell
            action={createServiceCategoryAction}
            branches={branches}
          />
        </CardContent>
      </Card>
    </section>
  );
}
