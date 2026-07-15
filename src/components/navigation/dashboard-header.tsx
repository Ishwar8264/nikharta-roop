// Load responsive account actions shared with the public navigation.
import { AuthNavActions } from "@/src/components/navigation/auth-nav-actions";
// Load the mobile and tablet drawer used when the sidebar is hidden.
import { MobileNav } from "@/src/components/navigation/mobile-nav";
// Load the shared salon wordmark used across application headers.
import { NavbarBrand } from "@/src/components/navigation/navbar-brand";
// Load the strict navigation item contract passed by the dashboard route group.
import type { NavigationItem } from "@/src/components/navigation/navigation.config";
// Load the existing theme selector for authenticated application pages.
import { ThemeToggle } from "@/src/components/theme-toggle";

// Describe the navigation selected by the current private or future admin layout.
type DashboardHeaderProps = {
  // Reuse the same destinations rendered by the desktop sidebar.
  navigationItems: readonly NavigationItem[];
};

// Render a common dashboard top bar with responsive mobile navigation.
export function DashboardHeader({ navigationItems }: DashboardHeaderProps) {
  // Keep the dashboard header focused on branding, preferences, and account controls.
  return (
    <header className="relative z-40 border-b border-border bg-background/90 backdrop-blur-xl">
      {/* Keep the header height aligned with public navigation and page calculations. */}
      <div className="flex min-h-20 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Reuse the same brand identity without duplicating header markup. */}
        <NavbarBrand />

        {/* Keep preferences and user controls visible in the desktop top bar. */}
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          {/* Preserve the global theme preference across private pages. */}
          <ThemeToggle />
          {/* Show the restored authenticated account menu beside the theme control. */}
          <AuthNavActions />
        </div>

        {/* Replace the hidden desktop sidebar with the shared mobile drawer. */}
        <div className="ml-auto lg:hidden">
          <MobileNav
            footer={
              <div className="space-y-5">
                {/* Keep theme selection clear inside the drawer account section. */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold">Theme</span>
                  <ThemeToggle />
                </div>
                {/* Reveal the complete account control inside the mobile drawer. */}
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
