import Link from "next/link";

/**
 * Purpose: Admin Services route for catalog management visibility.
 * Responsibilities: load protected service data and render branch/category/status overview.
 * Important notes: create/update APIs are already wired; this page starts with safe read management.
 */
import { Button } from "@/components/ui/button";
import { AdminServiceList } from "@/features/services/components/admin-service-list";
import { listAdminServices } from "@/features/services/queries/service.query";

/**
 * Renders the admin service management overview.
 */
export default async function AdminServicesPage() {
  const { error, services } = await listAdminServices({
    limit: 100,
    status: "all",
  });

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-700">Services</p>
          <h1 className="font-heading text-2xl font-semibold">
            Service management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review branch-linked services, pricing, durations, variants, and
            add-ons.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/services/categories/new">Create category</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/services/new">Create service</Link>
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <AdminServiceList services={services} />
    </section>
  );
}
