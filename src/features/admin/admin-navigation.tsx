import { Activity, ClipboardList, Sparkles, Ticket, Users } from "lucide-react";
import { SideNav } from "@/components/shared/side-nav";
import { hasPermission } from "@/lib/auth/permissions";
import { routes } from "@/config/routes";

/** Reuse the salon navigation pattern, including active links and responsive layout. */
export function AdminNavigation({ role }: { role: string }) {
  return (
    <aside
      className="min-w-0 md:sticky md:top-20 md:self-start"
      style={{ fontFamily: "var(--font-sans, Arial, sans-serif)" }}
    >
      <SideNav
        aria-label="Admin navigation"
        className="rounded-xl border border-border bg-card p-3"
        linkDefaults={{
          className: "items-start gap-3 rounded-lg px-3 py-2.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground aria-[current=page]:bg-primary/10 aria-[current=page]:font-medium aria-[current=page]:text-primary aria-[current=page]:hover:bg-primary/15",
        }}
        header={
          <div className="space-y-1 px-3 py-1">
            <h2 className="text-sm font-semibold">Admin</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">Manage salons and accounts.</p>
          </div>
        }
        items={[
          { label: "Salon verification", description: "Review salon documents.", href: routes.adminSalonVerification, permission: "salons.verify" as const, icon: <ClipboardList className="mt-0.5 size-4" /> },
          { label: "Users", description: "Manage user accounts.", href: routes.adminUsers, permission: "users.manage" as const, icon: <Users className="mt-0.5 size-4" /> },
          { label: "Coupons", description: "Manage offers and discounts.", href: routes.adminCoupons, permission: "platform.manage" as const, icon: <Ticket className="mt-0.5 size-4" /> },
          { label: "AI usage", description: "Track usage and limits.", href: routes.adminAiUsage, permission: "platform.manage" as const, icon: <Sparkles className="mt-0.5 size-4" /> },
          { label: "Activity log", description: "See who changed what.", href: routes.adminAuditLogs, permission: "platform.manage" as const, icon: <Activity className="mt-0.5 size-4" /> },
        ].filter((item) => hasPermission(role, item.permission))}
      />
    </aside>
  );
}
