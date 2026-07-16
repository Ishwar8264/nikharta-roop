// Load the authenticated dashboard shell reused by admin role pages.
import { DashboardLayout } from "@/src/components/layout/dashboard-layout";
// Load role-specific navigation selected from current server claims.
import { getNavigationItemsForRole } from "@/src/components/navigation/navigation.config";
// Load defense-in-depth server authorization for admin layouts.
import { requireRolePage } from "@/src/helpers/require-role-page";
// Load the React node type accepted by the route group layout.
import type { ReactNode } from "react";

// Compose admin routes with the shared responsive dashboard shell.
export default async function AdminRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Revalidate the current role before any administration layout content renders.
  const session = await requireRolePage(["ADMIN", "SUPER_ADMIN"]);

  // Select manager or owner navigation from current database claims.
  const navigationItems = getNavigationItemsForRole(session.role);

  // Keep admin pages focused on their content after server authorization succeeds.
  return (
    <DashboardLayout navigationItems={navigationItems}>
      {children}
    </DashboardLayout>
  );
}
