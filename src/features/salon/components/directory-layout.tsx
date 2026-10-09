import { Plus, Store } from "lucide-react";
import type { ReactNode } from "react";

import { SideNav } from "@/components/shared/side-nav";
import { routes } from "@/config/routes";

interface SalonDirectoryLayoutProps {
  children: ReactNode;
  isSignedIn: boolean;
}

/** Shared server shell for browsing and creating salons. Auth stays in each page. */
export function SalonDirectoryLayout({ children, isSignedIn }: SalonDirectoryLayoutProps) {
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 sm:py-12 md:grid-cols-[15rem_minmax(0,1fr)] lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="min-w-0 md:sticky md:top-20 md:self-start">
        <SideNav
          aria-label="Salon directory navigation"
          className="rounded-xl border border-border bg-card p-3"
          linkDefaults={{ className: "items-start gap-2.5" }}
          header={
            <div className="space-y-1 px-3 py-1">
              <h2 className="font-heading text-lg font-semibold">Salons</h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Find a salon or add your own.
              </p>
            </div>
          }
          items={[
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
