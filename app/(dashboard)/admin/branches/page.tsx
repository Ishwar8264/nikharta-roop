import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AdminBranchList } from "@/features/branches/components/admin-branch-list";
import { listAdminBranches } from "@/features/branches/queries/admin-branch.query";

export default async function AdminBranchesPage() {
  const { branches, error } = await listAdminBranches();

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-700">Branches</p>
          <h1 className="font-heading text-2xl font-semibold">
            Branch management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review branch locations, timings, status, and contact details.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/branches/new">Create branch</Link>
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <AdminBranchList branches={branches} />
    </section>
  );
}
