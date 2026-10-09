import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  FileText,
  Gift,
  Heart,
  Package,
  Scissors,
  Settings,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";

export interface QuickLink {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Customer-facing quick links surfaced to every signed-in user.
 *
 * Why a constant instead of a function:
 * None of these routes depend on a runtime slug or id, so the list is the
 * same on every render. Defining it at module scope keeps the JSX in
 * `DashboardHome` declarative and lets React skip re-allocating the array
 * across renders.
 */
export const CUSTOMER_QUICK_LINKS: readonly QuickLink[] = [
  {
    href: routes.appointments,
    icon: CalendarDays,
    title: "Upcoming appointments",
    description: "View, reschedule, or cancel your bookings.",
  },
  {
    href: routes.favorites,
    icon: Heart,
    title: "Favourites",
    description: "Salons and services you have saved for later.",
  },
  {
    href: routes.loyalty,
    icon: Gift,
    title: "Loyalty points",
    description: "Track rewards and redeem available offers.",
  },
  {
    href: routes.ai,
    icon: Sparkles,
    title: "AI assistant",
    description: "Get personalised salon and service suggestions.",
  },
] as const;

/**
 * Builds the salon-manage quick-link set for the salon the caller owns or
 * manages.
 *
 * Why a function instead of a constant:
 * Every link carries the salon slug, so the list is built per salon. The
 * caller has already fetched the salon summary; we just template in the
 * slug. The icons and copy stay constant — only the hrefs vary.
 */
export function buildSalonManageLinks(salonSlug: string): QuickLink[] {
  return [
    {
      href: routes.salonAppointmentsManage(salonSlug),
      icon: CalendarDays,
      title: "Appointments",
      description: "Today's bookings, status, and customers in the chair.",
    },
    {
      href: routes.salonServicesManage(salonSlug),
      icon: Scissors,
      title: "Services",
      description: "Add, edit, and price your salon's services.",
    },
    {
      href: routes.salonStaffManage(salonSlug),
      icon: Users,
      title: "Staff",
      description: "Schedules, leaves, and skills for your team.",
    },
    {
      href: routes.salonProductsManage(salonSlug),
      icon: Package,
      title: "Products",
      description: "Manage the products you sell at the salon.",
    },
    {
      href: routes.salonPackagesManage(salonSlug),
      icon: Package,
      title: "Packages",
      description: "Bundle services into priced packages.",
    },
    {
      href: routes.salonTemplatesManage(salonSlug),
      icon: FileText,
      title: "Templates",
      description: "Reusable service and pricing templates.",
    },
    {
      href: routes.salonVerification(salonSlug),
      icon: ShieldCheck,
      title: "Verification",
      description: "Submit KYC documents and review status.",
    },
    {
      href: routes.salonCouponsManage(salonSlug),
      icon: Ticket,
      title: "Coupons",
      description: "Create and manage discount coupons.",
    },
    {
      href: routes.salonSettingsManage(salonSlug),
      icon: Settings,
      title: "Settings",
      description: "Booking rules, advance payments, and walk-ins.",
    },
  ];
}

interface QuickLinksProps {
  links: readonly QuickLink[];
}

/**
 * Responsive grid of clickable feature cards.
 *
 * Why the grid is mobile-first:
 * The dashboard is the first screen a customer sees after login — most of
 * those sign-ins happen on phones. One column on mobile keeps each card
 * full-width and tappable; we widen to 2/3/4 only when there's room.
 *
 * Why each card is wrapped in a single Link:
 * The whole card reads as one affordance, so making only the title
 * clickable would shrink the tap target. Wrapping the entire surface in
 * a Link gives mobile users the full card as a hit area and lets the
 * keyboard focus ring cover the whole card.
 */
export function QuickLinks({ links }: QuickLinksProps) {
  return (
    <ul
      className={cn(
        "grid grid-cols-1 gap-4",
        "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      )}
    >
      {links.map((link) => (
        <li key={`${link.href}-${link.title}`}>
          <QuickLinkCard link={link} />
        </li>
      ))}
    </ul>
  );
}

interface QuickLinkCardProps {
  link: QuickLink;
}

function QuickLinkCard({ link }: QuickLinkCardProps) {
  const { href, icon: Icon, title, description } = link;

  return (
    <Link
      href={href}
      className={cn(
        "group/quick-link block rounded-xl outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
    >
      <Card className="h-full transition-colors group-hover/quick-link:ring-primary/40 group-hover/quick-link:bg-muted/30">
        <CardContent className="flex flex-col gap-3">
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              "bg-primary/10 text-primary",
            )}
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-medium text-foreground">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
