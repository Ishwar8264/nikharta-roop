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
              className="inline-flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-rose-50 hover:text-rose-900"
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
          <DropdownMenuItem asChild className="cursor-pointer px-2 py-2" key={item.href}>
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
