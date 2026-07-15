"use client";

// Load the resolved session so public auth actions can switch to the user menu.
import { useAuth } from "@/src/components/auth/providers/auth-provider";
// Load the authenticated account menu used after session restoration.
import { UserMenu } from "@/src/components/navigation/user-menu";
// Load the shared theme selector now composed inside global navigation.
import { ThemeToggle } from "@/src/components/theme-toggle";
// Load the shared button for public login and signup actions.
import { Button } from "@/src/components/ui/button";
// Load the shared class utility for active navigation states.
import { cn } from "@/src/lib/utils";
// Load recognizable icons for branding, routes, and public auth actions.
import {
  House,
  Images,
  LogIn,
  Sparkles,
  UserPlus,
  UserRound,
} from "lucide-react";
// Load the shared icon type for strictly typed navigation configuration.
import type { LucideIcon } from "lucide-react";
// Load optimized client navigation for every public and private destination.
import Link from "next/link";
// Read the current pathname so active navigation remains derived state.
import { usePathname } from "next/navigation";

// Describe one primary destination rendered consistently across screen sizes.
type AppNavItem = {
  // Store the destination used by Next.js client navigation.
  href: string;
  // Pair every compact link with one recognizable icon.
  icon: LucideIcon;
  // Show a clear customer-facing navigation label.
  label: string;
};

// Keep Home public while Portfolio remains the first Proxy-protected destination.
const APP_NAV_ITEMS: AppNavItem[] = [
  // Link every visitor to the public Home experience.
  { href: "/", icon: House, label: "Home" },
  // Let Proxy decide whether the visitor may open the private Portfolio page.
  { href: "/portfolio", icon: Images, label: "Portfolio" },
];

// Render account controls that change only after client session restoration resolves.
function NavbarAuthActions() {
  // Read the minimal session state required to switch public and private controls.
  const { isAuthenticated, isLoading } = useAuth();

  // Preserve navbar width while the me and optional refresh flow is running.
  if (isLoading) {
    return (
      <Button
        aria-label="Loading user session"
        disabled
        size="icon"
        type="button"
        variant="ghost"
      >
        <UserRound aria-hidden="true" className="size-4" />
      </Button>
    );
  }

  // Replace public authentication actions with the real account menu after login.
  if (isAuthenticated) {
    return <UserMenu />;
  }

  // Keep both public authentication routes visible before login.
  return (
    <div className="flex items-center gap-1">
      {/* Open the public OTP login route without invoking Proxy. */}
      <Button asChild className="px-2 xl:px-3" size="sm" variant="ghost">
        <Link href="/login">
          <LogIn aria-hidden="true" className="size-4" />
          <span className="hidden xl:inline">Log in</span>
          <span className="sr-only xl:hidden">Log in</span>
        </Link>
      </Button>

      {/* Open the public account registration route without invoking Proxy. */}
      <Button asChild className="px-2 xl:px-3" size="sm">
        <Link href="/signup">
          <UserPlus aria-hidden="true" className="size-4" />
          <span className="hidden xl:inline">Sign up</span>
          <span className="sr-only xl:hidden">Sign up</span>
        </Link>
      </Button>
    </div>
  );
}

// Render one global responsive navbar for public and authenticated application pages.
export function AppNavbar() {
  // Derive the selected primary destination directly from the current pathname.
  const pathname = usePathname();

  // Keep brand, primary routes, theme, and session actions in one stable header.
  return (
    <header className="relative z-40 border-b border-border bg-background/90 backdrop-blur-xl">
      {/* Constrain navigation while retaining enough room for compact mobile icons. */}
      <div className="mx-auto flex min-h-20 max-w-7xl items-center gap-1 px-4 sm:gap-3 sm:px-6 lg:px-10">
        {/* Return every visitor to the public Home route through the salon wordmark. */}
        <Link
          aria-label="Nikharta Roop home"
          className="group mr-auto flex shrink-0 items-center gap-3"
          href="/"
        >
          {/* Keep the established salon sparkle treatment as the global brand mark. */}
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

        {/* Show public and private destinations regardless of login state. */}
        <nav aria-label="Primary navigation" className="flex items-center gap-1">
          {/* Render every primary destination from one focused configuration. */}
          {APP_NAV_ITEMS.map((item) => {
            // Keep the configured icon available for this navigation item.
            const ItemIcon = item.icon;

            // Treat nested Portfolio pages as part of the same active destination.
            const isActive =
              item.href === "/"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            // Render one compact accessible link and let Proxy guard private routes.
            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-10 items-center gap-2 rounded-xl px-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-accent-foreground lg:px-3",
                  isActive && "bg-accent text-accent-foreground",
                )}
                href={item.href}
                key={item.href}
              >
                {/* Keep route meaning visible when the full label is hidden. */}
                <ItemIcon aria-hidden="true" className="size-4" />
                {/* Reveal full labels when the navbar has enough horizontal room. */}
                <span className="hidden lg:inline">{item.label}</span>
                {/* Preserve a descriptive compact label for assistive technologies. */}
                <span className="sr-only lg:hidden">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Keep theme selection available on every route without fixed-position overlap. */}
        <ThemeToggle />

        {/* Switch between public auth actions and the authenticated user menu. */}
        <NavbarAuthActions />
      </div>
    </header>
  );
}
