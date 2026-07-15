"use client";

// Load the shared class utility for active and orientation-specific navigation styles.
import { cn } from "@/src/lib/utils";
// Load the strict navigation item contract shared by every navigation surface.
import type {
  NavigationIcon,
  NavigationItem,
} from "@/src/components/navigation/navigation.config";
// Load client-side icon components after navigation data crosses the server boundary.
import {
  BadgeIndianRupee,
  Bell,
  BookOpenText,
  CalendarDays,
  CalendarRange,
  ChartNoAxesCombined,
  Crown,
  Gift,
  Heart,
  House,
  Images,
  MapPin,
  RefreshCcw,
  Scissors,
  ShieldCheck,
  Star,
  UsersRound,
  UserRound,
} from "lucide-react";
// Load the shared icon type used by the complete icon-key mapping.
import type { LucideIcon } from "lucide-react";
// Load optimized client navigation for every configured destination.
import Link from "next/link";
// Read the current pathname so active navigation stays derived state.
import { usePathname } from "next/navigation";

// Convert serializable navigation keys into renderable client icon components.
const NAVIGATION_ICONS: Record<NavigationIcon, LucideIcon> = {
  // Render a shield icon for branch administration destinations.
  admin: ShieldCheck,
  // Render a chart icon for owner-level business analytics.
  analytics: ChartNoAxesCombined,
  // Render an editorial icon for public and managed blog content.
  blogs: BookOpenText,
  // Render a calendar icon for customer and operational bookings.
  bookings: CalendarDays,
  // Render a location pin for public and managed salon branches.
  branches: MapPin,
  // Render a heart for customer-saved services.
  favorites: Heart,
  // Render a familiar home icon for the restored public showcase route.
  home: House,
  // Render a bell for customer and administrative communication.
  notifications: Bell,
  // Render a gift for active promotions and coupon management.
  offers: Gift,
  // Render the rupee icon for payment transaction destinations.
  payments: BadgeIndianRupee,
  // Render the established gallery icon for the private Portfolio destination.
  portfolio: Images,
  // Render a focused account icon for personal profile destinations.
  profile: UserRound,
  // Render a refresh icon for payment refund management.
  refunds: RefreshCcw,
  // Render a star for public, customer, staff, and moderated reviews.
  reviews: Star,
  // Render a calendar range for staff availability and leave.
  schedule: CalendarRange,
  // Render salon scissors for bookable services and staff skills.
  services: Scissors,
  // Render salon scissors for employee operations.
  staff: Scissors,
  // Render a crown for the owner-only system workspace.
  "super-admin": Crown,
  // Render a team icon for public staff profiles.
  team: UsersRound,
  // Render a users icon for owner-level account management.
  users: UsersRound,
  // Render a focused account icon for the customer dashboard.
  user: UserRound,
};

// Describe the reusable rendering options for horizontal and stacked navigation.
type NavLinksProps = {
  // Give each navigation landmark a clear accessible purpose.
  ariaLabel: string;
  // Allow layout wrappers to add positioning without replacing link styles.
  className?: string;
  // Render only destinations selected by the surrounding route layout.
  items: readonly NavigationItem[];
  // Close mobile navigation after a destination is selected when provided.
  onNavigate?: () => void;
  // Switch presentation without duplicating active-route behavior.
  variant: "horizontal" | "sidebar";
};

// Render one active-aware link collection shared by desktop, sidebar, and drawer navigation.
export function NavLinks({
  ariaLabel,
  className,
  items,
  onNavigate,
  variant,
}: NavLinksProps) {
  // Derive the active destination directly from the current App Router pathname.
  const pathname = usePathname();

  // Select the deepest matching destination so parent dashboards do not stay active.
  const activeHref = items.reduce<string | null>((currentHref, item) => {
    // Accept exact destinations and their nested page families.
    const matchesPathname =
      pathname === item.href ||
      (item.href !== "/" && pathname.startsWith(`${item.href}/`));

    // Preserve the current match when this destination does not contain the pathname.
    if (!matchesPathname) {
      return currentHref;
    }

    // Prefer the longer path because it represents the most specific destination.
    if (!currentHref || item.href.length > currentHref.length) {
      return item.href;
    }

    // Keep the existing deeper match when this item is only its parent.
    return currentHref;
  }, null);

  // Keep the semantic navigation landmark consistent across every presentation.
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        variant === "horizontal"
          ? "flex items-center gap-1"
          : "flex flex-col gap-1",
        className,
      )}
    >
      {/* Render every visible destination from the route layout configuration. */}
      {items.map((item) => {
        // Resolve the plain icon key only after data reaches the Client Component.
        const ItemIcon = NAVIGATION_ICONS[item.icon];

        // Mark only the deepest configured destination as active.
        const isActive = activeHref === item.href;

        // Share active semantics while adapting spacing to the selected orientation.
        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-xl text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-accent-foreground",
              variant === "horizontal" ? "px-3" : "w-full px-4 py-2.5",
              isActive && "bg-accent text-accent-foreground",
            )}
            href={item.href}
            key={item.href}
            onClick={onNavigate}
          >
            {/* Keep route meaning recognizable before the customer reads its label. */}
            <ItemIcon aria-hidden="true" className="size-4" />
            {/* Use the same customer-facing label across every viewport. */}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
