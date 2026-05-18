/**
 * Purpose: Admin route for creating a new branch-linked service.
 * Responsibilities: load selectable branches/categories and render the service create form.
 * Important notes: the form submits through the service API-backed server action.
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ServiceFormShell } from "@/components/admin/services/service-form-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAdminBranches } from "@/features/branches/queries/admin-branch.query";
import { createServiceAction } from "@/features/services/actions/service-admin.actions";
import { listPublicServiceCategories } from "@/features/services/queries/service.query";
import type { PublicServiceCategory } from "@/features/services/types/service.types";

/**
 * Renders the create service screen after preloading branch-specific category options.
 */
export default async function NewAdminServicePage() {
  const { branches, error } = await listAdminBranches();
  const categoriesByBranch = await loadCategoriesByBranch(
    branches.map((branch) => branch.id),
  );

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <Button asChild className="-ml-2 w-fit" size="sm" variant="ghost">
        <Link href="/admin/services">
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </Button>

      <Card className="bg-white/85">
        <CardHeader>
          <CardTitle>Create service</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
          <ServiceFormShell
            action={createServiceAction}
            branches={branches}
            categoriesByBranch={categoriesByBranch}
          />
        </CardContent>
      </Card>
    </section>
  );
}

/**
 * Loads available global and branch-specific categories for every manageable branch.
 */
async function loadCategoriesByBranch(branchIds: string[]) {
  const entries = await Promise.all(
    branchIds.map(async (branchId) => {
      const { categories } = await listPublicServiceCategories(branchId);

      return [branchId, categories] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<string, PublicServiceCategory[]>;
}
