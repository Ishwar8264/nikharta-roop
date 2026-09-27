import { ThemeToggle } from "@/components/shared/theme-toggle";

import { AuthBrand } from "./auth-brand";

/**
 * Dedicated navigation for authentication pages.
 *
 * Why:
 * Auth screens need minimal navigation: a reliable path home and appearance
 * control, without the distractions of the full public-site menu.
 */
export function AuthNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <nav
        aria-label="Authentication navigation"
        className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        <AuthBrand />
        <ThemeToggle />
      </nav>
    </header>
  );
}
