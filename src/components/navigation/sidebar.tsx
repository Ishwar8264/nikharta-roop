// Load active-aware stacked navigation shared with the mobile drawer.
import { NavLinks } from "@/src/components/navigation/nav-links";
// Load the strict navigation item contract supplied by the dashboard layout.
import type { NavigationItem } from "@/src/components/navigation/navigation.config";

// Describe the destinations displayed by the persistent desktop sidebar.
type SidebarProps = {
  // Reuse route-group configuration without owning authorization decisions.
  navigationItems: readonly NavigationItem[];
};

// Render the persistent dashboard sidebar only where desktop space is available.
export function Sidebar({ navigationItems }: SidebarProps) {
  // Keep navigation separated from route content with one semantic aside landmark.
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card/40 p-5 lg:block">
      {/* Explain the navigation region without competing with page headings. */}
      <p className="px-4 text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">
        Your space
      </p>
      {/* Reuse the exact active-link behavior used by the mobile drawer. */}
      <NavLinks
        ariaLabel="Dashboard navigation"
        className="mt-4"
        items={navigationItems}
        variant="sidebar"
      />
    </aside>
  );
}
