// Load the focused public shell used by marketing-facing routes.
import { PublicLayout } from "@/src/components/layout/public-layout";
// Load the React node type accepted by the route group layout.
import type { ReactNode } from "react";

// Compose every public route with the responsive public navigation only.
export default function PublicRouteLayout({ children }: { children: ReactNode }) {
  // Keep public route files focused on their own page content.
  return <PublicLayout>{children}</PublicLayout>;
}
