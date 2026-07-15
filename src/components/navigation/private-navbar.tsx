"use client";

// Load the standalone account menu rendered inside private navigation.
import { UserMenu } from "@/src/components/navigation/user-menu";
// Load the shared class utility for active navigation states.
import { cn } from "@/src/lib/utils";
// Load recognizable icons for the private brand and compact navigation.
import { House, Images, Sparkles } from "lucide-react";
// Load the shared icon type for strictly typed navigation configuration.
import type { LucideIcon } from "lucide-react";
// Load optimized client navigation for private application destinations.
import Link from "next/link";
// Read the current pathname so active navigation remains derived state.
import { usePathname } from "next/navigation";

// Describe one private destination rendered consistently across screen sizes.
type PrivateNavItem = {
  // Store the destination used by Next.js client navigation.
  href: string;
  // Pair every compact link with one recognizable icon.
  icon: LucideIcon;
  // Show a clear customer-facing navigation label.
  label: string;
};

// Keep the requested private destinations in one small navigation configuration.
const PRIVATE_NAV_ITEMS: PrivateNavItem[] = [
  // Link to the primary private home experience.
  { href: "/", icon: House, label: "Home" },
  // Reserve the portfolio destination for its upcoming private page.
  { href: "/portfolio", icon: Images, label: "Portfolio" },
];

// Render the reusable navbar intended for authenticated application screens.
export function PrivateNavbar() {
  // Derive the selected item directly from the current App Router pathname.
  const pathname = usePathname();

  // Keep branding, private destinations, and account actions in one compact bar.
  return (
    <header className="relative z-40 border-b border-border bg-background/90 backdrop-blur-xl">
      {/* Reserve right-side space for the globally positioned theme selector. */}
      <div className="mx-auto flex min-h-20 max-w-7xl items-center gap-2 px-4 pr-32 sm:gap-5 sm:px-6 sm:pr-36 lg:px-10 lg:pr-40">
        {/* Return to private Home when the salon wordmark is selected. */}
        <Link
          aria-label="Nikharta Roop home"
          className="group mr-auto flex shrink-0 items-center gap-3"
          href="/"
        >
          {/* Keep the existing salon sparkle treatment as the private brand mark. */}
          <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition group-hover:bg-primary-hover">
            <Sparkles aria-hidden="true" className="size-4" />
          </span>

          {/* Hide the full wordmark only where mobile width is constrained. */}
          <span className="hidden sm:block">
            <span className="font-display block text-xl leading-none font-semibold tracking-[-0.02em]">
              Nikharta Roop
            </span>
            <span className="mt-1 block text-[10px] font-bold tracking-[0.24em] text-muted-foreground uppercase">
              Salon &amp; Studio
            </span>
          </span>
        </Link>

        {/* Expose the requested private destinations with derived active styling. */}
        <nav aria-label="Private navigation" className="flex items-center gap-1">
          {/* Render every private destination from the focused shared configuration. */}
          {PRIVATE_NAV_ITEMS.map((item) => {
            // Keep the configured icon available for this navigation item.
            const ItemIcon = item.icon;
            // Treat nested portfolio routes as part of the same active destination.
            const isActive =
              item.href === "/"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            // Render one accessible link with compact mobile and full desktop content.
            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-10 items-center gap-2 rounded-xl px-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-accent-foreground sm:px-3",
                  isActive && "bg-accent text-accent-foreground",
                )}
                href={item.href}
                key={item.href}
              >
                {/* Keep destination meaning visible when the text label is hidden. */}
                <ItemIcon aria-hidden="true" className="size-4" />
                {/* Reveal labels when the navbar has enough horizontal space. */}
                <span className="hidden lg:inline">{item.label}</span>
                {/* Preserve a descriptive mobile label for assistive technologies. */}
                <span className="sr-only lg:hidden">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Keep user actions independent from private destination navigation. */}
        <UserMenu />
      </div>
    </header>
  );
}
