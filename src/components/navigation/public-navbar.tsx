"use client";

// Load the current browser session so private links remain hidden from guests.
import { useAuth } from "@/src/components/auth/providers/auth-provider";
// Load reusable guest and account controls for desktop and drawer navigation.
import { AuthNavActions } from "@/src/components/navigation/auth-nav-actions";
// Load the shared mobile and tablet drawer.
import { MobileNav } from "@/src/components/navigation/mobile-nav";
// Load active-aware horizontal navigation rendering.
import { NavLinks } from "@/src/components/navigation/nav-links";
// Load the shared salon wordmark used across application headers.
import { NavbarBrand } from "@/src/components/navigation/navbar-brand";
// Load real public and authenticated route configurations.
import {
  PRIVATE_NAV_ITEMS,
  PUBLIC_NAV_ITEMS,
} from "@/src/components/navigation/navigation.config";
// Load the existing light, dark, and system theme selector.
import { ThemeToggle } from "@/src/components/theme-toggle";

// Render one reliable top navigation for public pages across every viewport.
export function PublicNavbar() {
  // Read resolved authentication without storing duplicated navigation state.
  const { isAuthenticated } = useAuth();

  // Reveal the existing private destination only after a user is authenticated.
  const navigationItems = isAuthenticated
    ? PRIVATE_NAV_ITEMS
    : PUBLIC_NAV_ITEMS;

  // Keep desktop actions inline while moving mobile and tablet actions into a drawer.
  return (
    <header className="relative z-40 border-b border-border bg-background/90 backdrop-blur-xl">
      {/* Constrain public navigation to the established application content width. */}
      <div className="mx-auto flex min-h-20 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-10">
        {/* Return every visitor home through the reusable salon wordmark. */}
        <NavbarBrand />

        {/* Avoid an empty navigation landmark when the root logo is the only public link. */}
        {navigationItems.length > 0 ? (
          <NavLinks
            ariaLabel="Primary navigation"
            className="ml-auto hidden lg:flex"
            items={navigationItems}
            variant="horizontal"
          />
        ) : null}

        {/* Keep theme and session actions inline where horizontal room is reliable. */}
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          {/* Preserve theme selection on every public route. */}
          <ThemeToggle />
          {/* Switch guest actions to the authenticated user menu after restoration. */}
          <AuthNavActions />
        </div>

        {/* Move links and account controls into one touch-friendly mobile drawer. */}
        <div className="ml-auto lg:hidden">
          <MobileNav
            footer={
              <div className="space-y-5">
                {/* Keep theme selection understandable beside its compact control. */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold">Theme</span>
                  <ThemeToggle />
                </div>
                {/* Show complete guest or account labels inside the wider drawer. */}
                <AuthNavActions showLabels />
              </div>
            }
            navigationItems={navigationItems}
          />
        </div>
      </div>
    </header>
  );
}
