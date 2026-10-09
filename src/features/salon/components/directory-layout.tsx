import { Calendar, Gift, Info, Package, Plus, Scissors, Settings, Store } from "lucide-react";
import type { ReactNode } from "react";

import { SideNav } from "@/components/shared/side-nav";
import { routes } from "@/config/routes";

interface SalonDirectoryLayoutProps {
  children: ReactNode;
  isSignedIn: boolean;
  salon?: { name: string; slug: string; canManage: boolean };
}

/** Shared salon navigation shell. Each page resolves data and permissions on the server. */
export function SalonDirectoryLayout({ children, isSignedIn, salon }: SalonDirectoryLayoutProps) {
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
                {salon ? "Explore services and book your visit." : "Find a salon or add your own."}
              </p>
            </div>
          }
          items={salon ? [
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
                icon: <Scissors className="mt-0.5 size-4" />,
              },
              {
                label: "Products",
                description: "Browse salon products.",
                href: routes.salonProducts(salon.slug),
                icon: <Package className="mt-0.5 size-4" />,
              },
              {
                label: "Packages",
                description: "Explore service bundles.",
                href: routes.salonPackages(salon.slug),
                icon: <Gift className="mt-0.5 size-4" />,
              },
              {
                label: "Book appointment",
                description: "Choose a service and time.",
                href: routes.salonBooking(salon.slug),
                icon: <Calendar className="mt-0.5 size-4" />,
              },
              ...(salon.canManage ? [{
                label: "Manage salon",
                description: "Update your salon details.",
                href: routes.salonManage(salon.slug),
                icon: <Settings className="mt-0.5 size-4" />,
              }] : []),
          ] : [
            {
              label: "Browse salons",
              description: "Find salons near you.",
              href: routes.salons,
              matchNested: false,
              icon: <Store className="mt-0.5 size-4" />,
            },
            {
              label: "Add salon",
              description: "List your salon and get bookings.",
              href: isSignedIn
                ? routes.salonCreate
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
