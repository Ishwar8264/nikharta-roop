import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateBranchAction } from "@/features/branches/actions/branch-admin.actions";
import { BranchAdminForm } from "@/features/branches/components/branch-admin-form";
import { getAdminBranch } from "@/features/branches/queries/admin-branch.query";

type EditAdminBranchPageProps = {
  params: Promise<{ branchId: string }>;
};

export default async function EditAdminBranchPage({
  params,
}: EditAdminBranchPageProps) {
  const { branchId } = await params;
  const { branch, error } = await getAdminBranch(branchId);

  if (!branch) notFound();

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <Button asChild size="sm" variant="ghost" className="-ml-2 w-fit">
        <Link href="/admin/branches">
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </Button>

      <Card className="bg-white/85">
        <CardHeader>
          <CardTitle>Edit branch</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
          <BranchAdminForm
            action={updateBranchAction.bind(null, branch.id)}
            branch={branch}
            submitLabel="Save branch"
          />
        </CardContent>
      </Card>
    </section>
  );
}
