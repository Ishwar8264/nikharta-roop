// Load the shared top bar used by authenticated dashboard pages.
import { DashboardHeader } from "@/src/components/navigation/dashboard-header";
// Load the desktop-only sidebar that shares the same navigation configuration.
import { Sidebar } from "@/src/components/navigation/sidebar";
// Load the strict navigation item contract shared across dashboard surfaces.
import type { NavigationItem } from "@/src/components/navigation/navigation.config";
// Load the React node type accepted by the reusable dashboard shell.
import type { ReactNode } from "react";

// Describe the content and navigation required by one dashboard route group.
type DashboardLayoutProps = {
  // Render the active authenticated page beside the desktop sidebar.
  children: ReactNode;
  // Reuse one link configuration across desktop and mobile navigation.
  navigationItems: readonly NavigationItem[];
};

// Render one responsive dashboard shell for private and future admin route groups.
export function DashboardLayout({
  children,
  navigationItems,
}: DashboardLayoutProps) {
  // Keep the top bar stable while the content switches between dashboard routes.
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Provide account controls and mobile navigation above dashboard content. */}
      <DashboardHeader navigationItems={navigationItems} />
      {/* Keep the desktop sidebar and route content in one reliable flex row. */}
      <div className="flex min-h-[calc(100vh-5rem)] min-w-0">
        {/* Show the persistent navigation rail only where desktop space is available. */}
        <Sidebar navigationItems={navigationItems} />
        {/* Prevent wide route content from forcing horizontal page overflow. */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
