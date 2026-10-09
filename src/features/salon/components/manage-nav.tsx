import type { LucideIcon } from "lucide-react";
import {
  ClipboardCheck,
  Package,
  Receipt,
  Scissors,
  Settings,
  Shapes,
  Ticket,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";

type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED" | null;

interface ManageNavLink {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
  /**
   * When set, the card renders a status badge in the corner — used by the
   * Verification card so the owner can see their state without opening it.
   */
  status?: VerificationStatus;
}

/** Builds the salon-manage quick-link grid items for one salon. */
function buildLinks(slug: string, verification: VerificationStatus): ManageNavLink[] {
  return [
    {
      href: routes.salonServicesManage(slug),
      icon: Scissors,
      label: "Services",
      description: "Catalog, pricing, and what customers can book.",
    },
    {
      href: routes.salonProductsManage(slug),
      icon: Shapes,
      label: "Products",
      description: "Retail inventory and shelf items.",
    },
    {
      href: routes.salonPackagesManage(slug),
      icon: Package,
      label: "Packages",
      description: "Combos and bridal offerings.",
    },
    {
      href: routes.salonTemplatesManage(slug),
      icon: ClipboardCheck,
      label: "Activate catalog",
      description: "Turn on ready-made services in five minutes.",
    },
    {
      href: routes.salonVerification(slug),
      icon: ClipboardCheck,
      label: "Verification",
      description: "Submit KYC and trust documents.",
      status: verification,
    },
    {
      href: routes.salonCouponsManage(slug),
      icon: Ticket,
      label: "Coupons",
      description: "Run festive offers and seasonal discounts.",
    },
    {
      href: routes.salonSettingsManage(slug),
      icon: Settings,
      label: "Settings",
      description: "Booking buffer, advance payments, walk-ins.",
    },
    {
      href: routes.salonManage(slug),
      icon: Receipt,
      label: "Details & roster",
      description: "Salon profile, address, and team members.",
    },
  ];
}

type StatusVariant = "secondary" | "outline" | "destructive" | "default";

interface StatusBadge {
  label: string;
  variant: StatusVariant;
}

const STATUS_BADGE: Record<NonNullable<VerificationStatus>, StatusBadge> = {
  PENDING: { label: "Pending", variant: "outline" },
  VERIFIED: { label: "Verified", variant: "secondary" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  SUSPENDED: { label: "Suspended", variant: "destructive" },
};

interface SalonManageNavProps {
  salonSlug: string;
  salonName: string;
  verification?: VerificationStatus;
}

/**
 * Salon-manage dashboard navigation grid.
 *
 * Why this lives on the manage home: a salon owner's first stop is "what can I
 * do here?" — surfacing every wired sub-page as a single tap-target turns the
 * manage home into a real cockpit instead of a wall of forms. The grid is
 * mobile-first (1 col → 2 → 3 → 4) so it works in a single thumb sweep on a
 * phone, which is how most Indian salon owners run their shop.
 */
export function SalonManageNav({
  salonSlug,
  salonName,
  verification = null,
}: SalonManageNavProps) {
  const links = buildLinks(salonSlug, verification);

  return (
    <nav aria-label={`Manage ${salonName}`} className="space-y-4">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Quick actions
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything wired for {salonName}. Tap a card to jump in.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {links.map(({ href, icon: Icon, label, description, status }) => {
          const badge = status ? STATUS_BADGE[status] : null;
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "group relative flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-5",
                  "transition-colors hover:border-primary/60 hover:bg-primary/5",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      "bg-primary/10 text-primary transition-colors",
                      "group-hover:bg-primary/15",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  {badge ? (
                    <Badge variant={badge.variant} className="uppercase">
                      {badge.label}
                    </Badge>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <p className="font-medium leading-tight">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
