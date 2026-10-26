import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Clock, Gift, Scissors } from "lucide-react";
import { NavLink } from "@/components/shared/nav-link";
import { Separator } from "@/components/ui/separator";
import { routes } from "@/config/routes";
import { appointmentPriceFormatter } from "@/features/appointment/format";
import { formatDuration } from "@nikharta-roop/shared/schemas/forms/package";
import { PackagePublicationCard } from "@/features/package/package-publication-card";
import { getSession } from "@/lib/auth/get-session";
import { isResourceId } from "@/server/modules/salon/salon.helpers";
import { SalonNotFoundError, SalonRoleInsufficientError } from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement, getSalonSummaryBySlug } from "@/server/modules/salon/salon.service";
import { PackageNotFoundError } from "@/server/modules/package/package.errors";
import { getManagedSalonPackage, getPublicPackageById } from "@/server/modules/package/package.service";

type Props = { params: Promise<{ slug: string; packageId: string }> };

/** Keeps drafts private while retaining one ID-based detail URL. */
const getDetail = cache(async (slug: string, packageId: string) => {
  if (!isResourceId(packageId)) throw new PackageNotFoundError();
  try {
    const [pkg, salon] = await Promise.all([getPublicPackageById(slug, packageId), getSalonSummaryBySlug(slug)]);
    return { pkg, salon, preview: false };
  } catch (error) {
    if (!(error instanceof SalonNotFoundError) && !(error instanceof PackageNotFoundError)) throw error;
    const user = await getSession();
    if (!user) throw error;
    const [pkg, salon] = await Promise.all([getManagedSalonPackage(user.id, slug, packageId), getSalonForServiceManagement(slug, user.id)]);
    return { pkg, salon, preview: true };
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, packageId } = await params;
  try {
    const { pkg, preview } = await getDetail(slug, packageId);
    return { title: pkg.name, ...(preview ? { robots: { index: false, follow: false } } : {}) };
  } catch { return { title: "Package not found" }; }
}

export default async function PackageDetailPage({ params }: Props) {
  const { slug, packageId } = await params;
  let detail;
  try { detail = await getDetail(slug, packageId); } catch (error) {
    if (error instanceof SalonNotFoundError || error instanceof SalonRoleInsufficientError || error instanceof PackageNotFoundError) notFound();
    throw error;
  }
  const { pkg, salon, preview } = detail;
  const user = await getSession();
  let canManage = preview;
  if (user && !canManage) {
    try { await getSalonForServiceManagement(slug, user.id); canManage = true; } catch (error) {
      if (!(error instanceof SalonNotFoundError) && !(error instanceof SalonRoleInsufficientError)) throw error;
    }
  }
  return <main className="min-w-0 space-y-6">
    {preview ? <PackagePublicationCard salonId={pkg.salonId} packageId={pkg.id} status={pkg.status} salonIsLive={salon.status === "LIVE"} /> : null}
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-primary">{salon.name}</p><h1 className="mt-2 font-heading text-3xl font-semibold">{pkg.name}</h1><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Clock className="size-4" aria-hidden="true" />{formatDuration(pkg.duration)} · {pkg.services.length} services</p></div>
      {canManage ? <NavLink href={routes.salonPackageEdit(slug, pkg.id)} variant="outline" markActive={false}>Edit package</NavLink> : null}
    </header>
    <Separator />
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      <section aria-labelledby="package-services" className="rounded-xl border bg-card p-5"><h2 id="package-services" className="flex items-center gap-2 font-heading text-lg font-semibold"><Scissors className="size-4" aria-hidden="true" />Included services</h2>
        {pkg.services.length ? <ul className="mt-4 divide-y divide-border">{pkg.services.map((line) => <li key={line.serviceId} className="flex items-center justify-between gap-3 py-3"><span className="text-sm font-medium">{line.service.name}</span><span className="text-sm text-muted-foreground">{appointmentPriceFormatter.format(line.service.price)}</span></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No services included yet.</p>}
      </section>
      <aside className="space-y-4 rounded-xl border bg-card p-5"><Gift className="size-5 text-primary" aria-hidden="true" /><p className="text-2xl font-semibold">{appointmentPriceFormatter.format(pkg.price)}</p><p className="text-xs text-muted-foreground">One price for all included services.</p>
        {!preview && salon.status === "LIVE" ? <NavLink href={`${routes.salonBooking(slug)}?package=${encodeURIComponent(pkg.id)}`} variant="default" markActive={false} className="w-full justify-center">Book package</NavLink> : null}
      </aside>
    </div>
  </main>;
}
