/**
 * Purpose: Admin route for creating a portfolio item.
 * Responsibilities: load active branches and branch-scoped relation options before rendering the form.
 * Important notes: media selection uses the shared uploader instead of exposing raw URL inputs.
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAdminBranches } from "@/features/branches/queries/admin-branch.query";
import { createPortfolioAction } from "@/features/portfolio/actions/portfolio-admin.actions";
import { PortfolioAdminForm } from "@/features/portfolio/components/portfolio-admin-form";
import { listPortfolioRelationOptions } from "@/features/portfolio/queries/portfolio.query";

/**
 * Renders the create portfolio item screen.
 */
export default async function NewAdminPortfolioPage() {
  const [{ branches, error }, relationOptions] = await Promise.all([
    listAdminBranches(),
    listPortfolioRelationOptions(),
  ]);

  return (
    <section className="mx-auto w-full max-w-4xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <Button asChild className="-ml-2 w-fit" size="sm" variant="ghost">
        <Link href="/admin/portfolio">
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </Button>

      <Card className="bg-white/85">
        <CardHeader>
          <CardTitle>Create portfolio item</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
          <PortfolioAdminForm
            action={createPortfolioAction}
            branches={branches}
            packages={relationOptions.packages}
            services={relationOptions.services}
            staff={relationOptions.staff}
          />
        </CardContent>
      </Card>
    </section>
  );
}
