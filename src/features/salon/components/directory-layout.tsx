import { getSession } from "@/lib/auth/get-session";
import { canCreateSalon } from "@/features/onboarding/policy";
import { Calendar, Gift, Info, List, Package, Plus, Scissors, Settings, ShieldCheck, Store, Users, Clock, ClipboardCheck, Ticket, Pencil } from "lucide-react";
import type { ReactNode } from "react";

import { SideNav } from "@/components/shared/side-nav";
import { routes } from "@/config/routes";

interface SalonDirectoryLayoutProps {
  children: ReactNode;
  isSignedIn: boolean;
  salon?: { name: string; slug: string; canManage: boolean; isPublic?: boolean; canBook?: boolean };
}

/** Shared salon navigation shell. Each page resolves data and permissions on the server. */
export async function SalonDirectoryLayout({ children, isSignedIn, salon }: SalonDirectoryLayoutProps) {
  const user = isSignedIn ? await getSession() : null;
  const eligible = user ? canCreateSalon(user) : false;
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 sm:py-12 md:grid-cols-[15rem_minmax(0,1fr)] lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="min-w-0 md:sticky md:top-20 md:self-start">
        <SideNav
          aria-label={salon ? "Salon navigation" : "Salon directory navigation"}
          className="rounded-xl border border-border bg-card p-3"
          linkDefaults={{ className: "items-start gap-2.5" }}
          header={
            <div className="space-y-1 px-3 py-1">
              <h2 className="font-heading text-lg font-semibold">{salon?.name ?? "Salons"}</h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {salon ? salon.isPublic === false ? "Manage your profile, verification and publication status." : salon.canBook === false ? "Temporarily closed. Browse services; bookings are unavailable." : "Explore services and book your visit." : "Find a salon or add your own."}
              </p>
            </div>
          }
          items={salon ? [
              ...(salon.isPublic === false ? [{
                label: "Verification",
                description: "Submit documents and track approval.",
                href: routes.salonVerification(salon.slug),
                icon: <ShieldCheck className="mt-0.5 size-4" />,
              }] : [
              {
                label: "Overview",
                description: "About this salon.",
                href: routes.salonDetail(salon.slug),
                matchNested: false,
                icon: <Info className="mt-0.5 size-4" />,
              },
              {
                label: "Services",
                description: "Explore treatments and prices.",
                href: routes.salonServices(salon.slug),
                subItems: [
                  { label: "All services", href: routes.salonServices(salon.slug), matchNested: false, icon: <List className="size-4" /> },
                  ...(salon.canManage ? [{ label: "Catalog", href: routes.salonServiceCatalog(salon.slug), matchNested: false, icon: <List className="size-4" /> }] : []),
                  ...(salon.canManage ? [{ label: "Add service", href: routes.salonServiceCreate(salon.slug), matchNested: false, icon: <Plus className="size-4" /> }] : []),
                ],
                icon: <Scissors className="mt-0.5 size-4" />,
              },
              {
                label: "Products",
                description: "Browse salon products.",
                href: routes.salonProducts(salon.slug),
                subItems: [
                  { label: "All products", href: routes.salonProducts(salon.slug), matchNested: false, icon: <List className="size-4" /> },
                  ...(salon.canManage ? [{ label: "Catalog", href: routes.salonProductCatalog(salon.slug), matchNested: false, icon: <List className="size-4" /> }] : []),
                  ...(salon.canManage ? [{ label: "Add product", href: routes.salonProductCreate(salon.slug), matchNested: false, icon: <Plus className="size-4" /> }] : []),
                ],
                icon: <Package className="mt-0.5 size-4" />,
              },
              {
                label: "Packages",
                description: "Explore service bundles.",
                href: routes.salonPackages(salon.slug),
                subItems: [
                  { label: "All packages", href: routes.salonPackages(salon.slug), matchNested: false, icon: <List className="size-4" /> },
                  ...(salon.canManage ? [{ label: "Catalog", href: routes.salonPackageCatalog(salon.slug), matchNested: false, icon: <List className="size-4" /> }] : []),
                  ...(salon.canManage ? [{ label: "Add package", href: routes.salonPackageCreate(salon.slug), matchNested: false, icon: <Plus className="size-4" /> }] : []),
                ],
                icon: <Gift className="mt-0.5 size-4" />,
              },
              ...(salon.canBook === false ? [] : [{
                label: "Book appointment",
                description: "Choose a service and time.",
                href: routes.salonBooking(salon.slug),
                icon: <Calendar className="mt-0.5 size-4" />,
              }]),
              ]),
              ...(salon.canManage ? [{
                label: "Staff",
                description: "Schedules, leaves, and team skills.",
                href: routes.salonStaff(salon.slug),
                icon: <Users className="mt-0.5 size-4" />,
              }, {
                label: "Appointments", href: routes.salonAppointments(salon.slug), icon: <Calendar className="mt-0.5 size-4" />,
              }, {
                label: "Activate catalog", href: routes.salonTemplates(salon.slug), icon: <ClipboardCheck className="mt-0.5 size-4" />,
              }, {
                label: "Coupons", href: routes.salonCoupons(salon.slug), icon: <Ticket className="mt-0.5 size-4" />,
              }, {
                label: "Working hours", href: routes.salonWorkingHours(salon.slug), icon: <Clock className="mt-0.5 size-4" />,
              }, {
                label: "Settings", href: routes.salonSettings(salon.slug), icon: <Settings className="mt-0.5 size-4" />,
              }, {
                label: "Edit salon", href: routes.salonEdit(salon.slug), icon: <Pencil className="mt-0.5 size-4" />,
              }] : []),
              ...(salon.canManage && salon.isPublic !== false ? [{ label: "Verification", href: routes.salonVerification(salon.slug), icon: <ShieldCheck className="mt-0.5 size-4" /> }] : []),
              ...(salon.canManage && salon.isPublic === false ? [
                { label: "Service catalog", href: routes.salonServiceCatalog(salon.slug), icon: <Scissors className="mt-0.5 size-4" /> },
                { label: "Product catalog", href: routes.salonProductCatalog(salon.slug), icon: <Package className="mt-0.5 size-4" /> },
                { label: "Package catalog", href: routes.salonPackageCatalog(salon.slug), icon: <Gift className="mt-0.5 size-4" /> },
              ] : []),
          ] : [
            {
              label: "Browse salons",
              description: "Find salons near you.",
              href: routes.salons,
              matchNested: false,
              icon: <Store className="mt-0.5 size-4" />,
            },
            {
              label: isSignedIn && !eligible ? "Become a salon partner" : "Add salon",
              description: "List your salon and get bookings.",
              href: isSignedIn
                ? eligible
                  ? routes.salonCreate
                  : routes.partnerOnboarding
                : `${routes.login}?redirect=${encodeURIComponent(routes.salonCreate)}`,
              markActive: isSignedIn,
              matchNested: false,
              icon: <Plus className="mt-0.5 size-4" />,
            },
          ]}
        />
      </aside>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
