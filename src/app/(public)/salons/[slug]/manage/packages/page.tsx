import { Gift } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { appointmentPriceFormatter } from "@/features/appointment/format";
import { PackageRowActions } from "@/features/package/package-row-actions";
import { formatDuration } from "@/features/package/schemas";
import { getSession } from "@/lib/auth/get-session";
import { listSalonPackageCatalog } from "@/server/modules/package/package.service";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Manage packages | Nikharta Roop",
  description: "Create, price, and schedule your salon's packages and combos.",
};

/** Manager view of every package, including inactive ones. */
export default async function ManagePackagesPage({ params }: Props) {
  const { slug } = await params;
  const user = await getSession();
  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(routes.salonPackagesManage(slug))}`,
    );
  }

  let salonName = "";
  let packages;
  try {
    const [salon, list] = await Promise.all([
      getSalonForServiceManagement(slug, user.id),
      // Manager view — inactive packages stay visible here.
      listSalonPackageCatalog(slug, { limit: 100, includeInactive: true }),
    ]);
    salonName = salon.name;
    packages = list;
  } catch (error) {
    if (
      error instanceof SalonNotFoundError ||
      error instanceof SalonRoleInsufficientError
    ) {
      notFound();
    }
    throw error;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href={routes.salonPackages(slug)}
            className="text-sm text-primary underline"
          >
            Public packages page
          </Link>
          <h1 className="mt-3 font-heading text-3xl font-semibold">
            Packages
          </h1>
          <p className="mt-2 text-muted-foreground">{salonName}</p>
        </div>
        <Button render={<Link href={routes.salonPackageCreate(slug)} />}>
          New package
        </Button>
      </header>

      {packages.items.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No packages yet"
          description="Bundle your services into a combo — bridal days and grooming resets sell best."
          action={
            <Button render={<Link href={routes.salonPackageCreate(slug)} />}>
              Add your first package
            </Button>
          }
        />
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="mt-8 space-y-3 lg:hidden">
            {packages.items.map((pkg) => (
              <li
                key={pkg.id}
                className="space-y-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{pkg.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {appointmentPriceFormatter.format(pkg.price)} ·{" "}
                      {formatDuration(pkg.duration)}
                    </p>
                  </div>
                  <Badge
                    variant={pkg.isActive ? "secondary" : "outline"}
                  >
                    {pkg.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <PackageRowActions salonSlug={slug} pkg={pkg} />
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="mt-8 hidden overflow-x-auto rounded-xl border lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Package</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {packages.items.map((pkg) => (
                  <tr key={pkg.id} className="bg-card">
                    <td className="px-4 py-3 font-medium">{pkg.name}</td>
                    <td className="px-4 py-3">
                      {appointmentPriceFormatter.format(pkg.price)}
                    </td>
                    <td className="px-4 py-3">
                      {formatDuration(pkg.duration)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={pkg.isActive ? "secondary" : "outline"}>
                        {pkg.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <PackageRowActions salonSlug={slug} pkg={pkg} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
