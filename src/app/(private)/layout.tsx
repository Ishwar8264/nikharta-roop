// Load the authenticated application shell shared by private customer routes.
import { DashboardLayout } from "@/src/components/layout/dashboard-layout";
// Load role-specific navigation selected from current server claims.
import { getNavigationItemsForRole } from "@/src/components/navigation/navigation.config";
// Load defense-in-depth server authorization for protected customer layouts.
import { requireRolePage } from "@/src/helpers/require-role-page";
// Load the React node type accepted by the route group layout.
import type { ReactNode } from "react";

// Compose every private customer route with the shared dashboard navigation.
export default async function PrivateRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Revalidate the database session in case future Proxy matcher coverage drifts.
  const session = await requireRolePage(["USER"]);

  // Select only the current role's serializable navigation destinations.
  const navigationItems = getNavigationItemsForRole(session.role);

  // Keep the authenticated customer shell separate from authorization logic.
  return (
    <DashboardLayout navigationItems={navigationItems}>
      {children}
    </DashboardLayout>
  );
}
