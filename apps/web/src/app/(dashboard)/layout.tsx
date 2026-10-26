import { redirect } from "next/navigation";
import { CalendarDays, Gift, Heart, House, Plus, Settings, ShieldCheck, Sparkles, Store, UserRound } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SideNav } from "@/components/shared/side-nav";
import { canAccessAdmin, adminDestination } from "@/lib/auth/permissions";
import { routes } from "@/config/routes";
import { canCreateSalon, isOnboardingComplete } from "@/features/onboarding/policy";
import { getSession } from "@/lib/auth/get-session";
import { listUserSalonMemberships } from "@/server/modules/salon/salon.repository";

/** Authenticate all account pages and share the same navigation shell. */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect(routes.login);
  const memberships = await listUserSalonMemberships(user.id);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <div className="min-h-[calc(100dvh-4rem-1px)] flex-1">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 sm:py-12 md:grid-cols-[15rem_minmax(0,1fr)] lg:grid-cols-[17rem_minmax(0,1fr)]">
          <aside className="min-w-0 md:sticky md:top-20 md:self-start">
            <SideNav
              aria-label="Account navigation"
              className="rounded-xl border border-border bg-card p-3"
              header={<div className="space-y-1 px-3 py-1"><h2 className="font-heading text-lg font-semibold">Your account</h2><p className="text-xs text-muted-foreground">Bookings, profile and salon access.</p></div>}
              groups={[
                { id: "account", items: [
                  { label: "Profile", href: routes.profile, icon: <UserRound className="size-4" /> },
                  { label: "Dashboard", href: routes.dashboard, icon: <House className="size-4" /> },
                  { label: "Appointments", href: routes.appointments, icon: <CalendarDays className="size-4" /> },
                  { label: "Favorites", href: routes.favorites, icon: <Heart className="size-4" /> },
                  { label: "Loyalty", href: routes.loyalty, icon: <Gift className="size-4" /> },
                  { label: "AI Assistant", href: routes.ai, icon: <Sparkles className="size-4" /> },
                  { label: "Settings", href: routes.settings, icon: <Settings className="size-4" /> },
                ] },
                { id: "salons", label: "Salon access", items: [
                  ...memberships.filter(({ role, salon }) => role !== "STAFF" || salon.isActive).map(({ role, salon }) => ({
                    id: salon.id,
                    label: salon.name,
                    description: role === "OWNER" ? "Owner · Manage salon" : role === "MANAGER" ? "Manager · Manage salon" : "Staff · View salon",
                    href: role === "STAFF" ? routes.salonDetail(salon.slug) : routes.salonEdit(salon.slug),
                    icon: <Store className="mt-0.5 size-4" />,
                    className: "items-start gap-2.5",
                  })),
                  ...(user.accountType === "SALON_PARTNER" ? [{ label: canCreateSalon(user) ? "Add salon" : "Complete partner setup", href: canCreateSalon(user) ? routes.salonCreate : routes.partnerOnboarding, icon: <Plus className="size-4" /> }] : []),
                ] },
                { id: "setup", items: canAccessAdmin(user.role)
                  ? [{ label: "Admin", href: adminDestination(user.role), icon: <ShieldCheck className="size-4" /> }]
                  : isOnboardingComplete(user) ? [] : [{ label: "Complete account setup", href: routes.onboarding, icon: <UserRound className="size-4" /> }],
                },
              ]}
            />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
