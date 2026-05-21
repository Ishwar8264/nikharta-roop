/**
 * Purpose: Shared customer account navigation links for dropdown and sheet layouts.
 * Responsibilities: render account destinations with icons and variant-specific spacing.
 * Important notes: link data stays local because the customer nav is short and static.
 */
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Gift,
  HeartHandshake,
  Home,
  Sparkles,
  UserRound,
  WalletCards,
} from "lucide-react";

import {
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const customerAccountLinks = [
  { href: "/account", icon: Home, label: "Account" },
  { href: "/account/book", icon: Sparkles, label: "Book" },
  { href: "/account/bookings", icon: CalendarDays, label: "Bookings" },
  { href: "/account/consultations", icon: HeartHandshake, label: "Consultations" },
  { href: "/account/loyalty", icon: WalletCards, label: "Loyalty" },
  { href: "/account/notifications", icon: Bell, label: "Notifications" },
  { href: "/account/offers", icon: Gift, label: "Offers" },
  { href: "/account/profile", icon: UserRound, label: "Profile" },
];

type CustomerAccountLinksProps = {
  className?: string;
  variant?: "dropdown" | "sheet";
};

/**
 * Renders customer account links in dropdown or sheet navigation contexts.
 */
export function CustomerAccountLinks({
  className,
  variant = "dropdown",
}: CustomerAccountLinksProps) {
  if (variant === "sheet") {
    return (
      <nav
        aria-label="Customer account navigation"
        className={cn("grid gap-1", className)}
      >
        {customerAccountLinks.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              className="inline-flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-950 transition-colors hover:bg-rose-50 hover:text-rose-900"
              href={item.href}
              key={item.href}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <DropdownMenuGroup className={cn("grid gap-1 p-1", className)}>
      {customerAccountLinks.map((item) => {
        const Icon = item.icon;

        return (
          <DropdownMenuItem asChild className="cursor-pointer p-2" key={item.href}>
            <Link href={item.href}>
              <Icon className="size-4 text-stone-500" />
              <span>{item.label}</span>
            </Link>
          </DropdownMenuItem>
        );
      })}
    </DropdownMenuGroup>
  );
}
