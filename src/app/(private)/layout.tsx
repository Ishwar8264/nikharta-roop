// Load the authenticated application shell shared by private customer routes.
import { DashboardLayout } from "@/src/components/layout/dashboard-layout";
// Load only navigation destinations that currently exist in the application.
import { PRIVATE_NAV_ITEMS } from "@/src/components/navigation/navigation.config";
// Load the React node type accepted by the route group layout.
import type { ReactNode } from "react";

// Compose every private customer route with the shared dashboard navigation.
export default function PrivateRouteLayout({ children }: { children: ReactNode }) {
  // Let Proxy remain the security boundary while this layout owns presentation.
  return (
    <DashboardLayout navigationItems={PRIVATE_NAV_ITEMS}>
      {children}
    </DashboardLayout>
  );
}
