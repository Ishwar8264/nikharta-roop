import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBranchAction } from "@/features/branches/actions/branch-admin.actions";
import { BranchAdminForm } from "@/features/branches/components/branch-admin-form";

export default function NewAdminBranchPage() {
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
          <CardTitle>Create branch</CardTitle>
        </CardHeader>
        <CardContent>
          <BranchAdminForm action={createBranchAction} submitLabel="Create branch" />
        </CardContent>
      </Card>
    </section>
  );
}
