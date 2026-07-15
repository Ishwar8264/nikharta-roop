// Load the authenticated dashboard shell reused by staff role pages.
import { DashboardLayout } from "@/src/components/layout/dashboard-layout";
// Load role-specific navigation selected from current server claims.
import { getNavigationItemsForRole } from "@/src/components/navigation/navigation.config";
// Load defense-in-depth server authorization for staff layouts.
import { requireRolePage } from "@/src/helpers/require-role-page";
// Load the React node type accepted by the route group layout.
import type { ReactNode } from "react";

// Compose staff routes with the shared responsive dashboard shell.
export default async function StaffRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Revalidate the current role before any operational layout content renders.
  const session = await requireRolePage(["STAFF", "ADMIN", "SUPER_ADMIN"]);

  // Select the complete navigation hierarchy for the current database role.
  const navigationItems = getNavigationItemsForRole(session.role);

  // Keep staff pages focused on their content after server authorization succeeds.
  return (
    <DashboardLayout navigationItems={navigationItems}>
      {children}
    </DashboardLayout>
  );
}
