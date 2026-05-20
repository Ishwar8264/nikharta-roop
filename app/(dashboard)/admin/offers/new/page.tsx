/**
 * Purpose: Admin route for creating an offer.
 * Responsibilities: load branches and active services, then render the offer create form.
 * Important notes: global offers can be created without branch or service restrictions.
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAdminBranches } from "@/features/branches/queries/admin-branch.query";
import { createOfferAction } from "@/features/offers/actions/offer-admin.actions";
import { OfferAdminForm } from "@/features/offers/components/offer-admin-form";
import { listOfferServiceOptions } from "@/features/offers/queries/offer.query";

/**
 * Renders the create offer screen.
 */
export default async function NewAdminOfferPage() {
  const [{ branches, error }, serviceOptions] = await Promise.all([
    listAdminBranches(),
    listOfferServiceOptions(),
  ]);

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <Button asChild className="-ml-2 w-fit" size="sm" variant="ghost">
        <Link href="/admin/offers">
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </Button>

      <Card className="bg-white/85">
        <CardHeader>
          <CardTitle>Create offer</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
          <OfferAdminForm
            action={createOfferAction}
            branches={branches}
            serviceOptions={serviceOptions}
          />
        </CardContent>
      </Card>
    </section>
  );
}
