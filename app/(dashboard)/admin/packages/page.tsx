/**
 * Purpose: Admin Packages route for package management visibility.
 * Responsibilities: load protected package data and render branch-linked package overview.
 * Important notes: package creation supports initial service composition and media upload.
 */
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AdminPackageList } from "@/features/packages/components/admin-package-list";
import { listAdminPackages } from "@/features/packages/queries/package.query";

/**
 * Renders the admin package management overview.
 */
export default async function AdminPackagesPage() {
  const { error, packages } = await listAdminPackages({
    limit: 100,
    status: "all",
  });

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-700">Packages</p>
          <h1 className="font-heading text-2xl font-semibold">
            Package management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review branch-linked beauty packages, pricing, status, and attached
            services.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/packages/new">Create package</Link>
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <AdminPackageList packages={packages} />
    </section>
  );
}
