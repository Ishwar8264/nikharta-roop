// Load the authenticated dashboard shell reused by owner role pages.
import { DashboardLayout } from "@/src/components/layout/dashboard-layout";
// Load role-specific navigation selected from current server claims.
import { getNavigationItemsForRole } from "@/src/components/navigation/navigation.config";
// Load defense-in-depth server authorization for owner layouts.
import { requireRolePage } from "@/src/helpers/require-role-page";
// Load the React node type accepted by the route group layout.
import type { ReactNode } from "react";

// Compose owner routes with the shared responsive dashboard shell.
export default async function SuperAdminRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Revalidate the owner role before any full-access layout content renders.
  const session = await requireRolePage(["SUPER_ADMIN"]);

  // Select full owner navigation from current database claims.
  const navigationItems = getNavigationItemsForRole(session.role);

  // Keep owner pages focused on content after server authorization succeeds.
  return (
    <DashboardLayout navigationItems={navigationItems}>
      {children}
    </DashboardLayout>
  );
}
