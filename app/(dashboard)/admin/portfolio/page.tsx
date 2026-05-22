/**
 * Purpose: Admin Portfolio route for salon gallery management.
 * Responsibilities: load protected portfolio items and render branch-linked gallery controls.
 * Important notes: create flow supports uploaded gallery, before, and after images.
 */
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AdminPortfolioList } from "@/features/portfolio/components/admin-portfolio-list";
import { listAdminPortfolio } from "@/features/portfolio/queries/portfolio.query";

/**
 * Renders the admin portfolio management overview.
 */
export default async function AdminPortfolioPage() {
  const { error, items } = await listAdminPortfolio({ limit: 100 });

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-700">Portfolio</p>
          <h1 className="font-heading text-2xl font-semibold">
            Portfolio management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review branch-linked work, before-after media, featured status, and
            public gallery visibility.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/portfolio/new">Create portfolio item</Link>
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <AdminPortfolioList items={items} />
    </section>
  );
}
