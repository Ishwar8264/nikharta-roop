// Load the reusable role and public placeholder presentation.
import { ComingSoon } from "@/src/components/shared/coming-soon";
// Load the strict navigation item contract used as the route catalog.
import type { NavigationItem } from "@/src/components/navigation/navigation.config";
// Load metadata typing for dynamic placeholder browser titles.
import type { Metadata } from "next";
// Stop unknown dynamic sections through the App Router not-found boundary.
import { notFound } from "next/navigation";

// Describe one validated dynamic placeholder section.
type SectionComingSoonProps = {
  // Explain the surrounding public or role-specific application area.
  areaLabel: string;
  // Match only routes nested beneath this exact URL base.
  basePath: string;
  // Reuse the same catalog that renders the area's navigation.
  navigationItems: readonly NavigationItem[];
  // Receive the dynamic route segment supplied by the App Router.
  section: string;
};

// Resolve one configured section without allowing arbitrary dynamic routes.
const getSectionItem = ({
  basePath,
  navigationItems,
  section,
}: Omit<SectionComingSoonProps, "areaLabel">) => {
  // Build the exact URL represented by this validated dynamic route segment.
  const sectionHref = `${basePath}/${section}`;

  // Accept the section only when the same route exists in visible navigation.
  return navigationItems.find((item) => item.href === sectionHref);
};

// Build consistent metadata for one configured placeholder section.
export const createSectionMetadata = (
  props: SectionComingSoonProps,
): Metadata => {
  // Resolve the requested section through the shared navigation catalog.
  const item = getSectionItem(props);

  // Return neutral metadata when the page will resolve through not-found handling.
  if (!item) {
    return { title: "Page Not Found | Nikharta Roop" };
  }

  // Keep temporary metadata aligned with the visible destination label.
  return {
    description: `${item.label} for ${props.areaLabel} is coming soon.`,
    title: `${item.label} | Nikharta Roop`,
  };
};

// Render one configured section with the shared Coming Soon presentation.
export function SectionComingSoon(props: SectionComingSoonProps) {
  // Resolve the requested section through the same catalog used by navigation.
  const item = getSectionItem(props);

  // Reject arbitrary section URLs before rendering placeholder content.
  if (!item) {
    notFound();
  }

  // Reuse one visual component while keeping section copy specific and readable.
  return (
    <ComingSoon
      description={`The ${item.label.toLowerCase()} experience for ${props.areaLabel} is being prepared. Please check back soon.`}
      eyebrow={props.areaLabel}
      title={`${item.label} is coming soon.`}
    />
  );
}
