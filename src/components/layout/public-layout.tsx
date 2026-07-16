// Load the responsive top navigation used only by public application routes.
import { PublicNavbar } from "@/src/components/navigation/public-navbar";
// Load the React node type accepted by the reusable public shell.
import type { ReactNode } from "react";

// Describe the focused content accepted by the public route shell.
type PublicLayoutProps = {
  // Render the active public page beneath the top navigation.
  children: ReactNode;
};

// Render the lightweight public shell without introducing dashboard navigation.
export function PublicLayout({ children }: PublicLayoutProps) {
  // Keep the navbar outside page content so routes retain semantic main elements.
  return (
    <>
      {/* Show one responsive public navbar above every marketing page. */}
      <PublicNavbar />
      {/* Render the active public page without another unnecessary wrapper. */}
      {children}
    </>
  );
}
