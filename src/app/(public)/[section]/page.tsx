// Load public navigation as the allowlist for dynamic public sections.
import { PUBLIC_NAV_ITEMS } from "@/src/components/navigation/navigation.config";
// Load the reusable validated placeholder and its metadata helper.
import {
  createSectionMetadata,
  SectionComingSoon,
} from "@/src/components/shared/section-coming-soon";

// Describe the asynchronous dynamic section supplied by Next.js 16.
type PublicSectionPageProps = {
  // Await the public route segment before validating it against navigation.
  params: Promise<{ section: string }>;
};

// Build browser metadata only for configured public navigation sections.
export async function generateMetadata({ params }: PublicSectionPageProps) {
  // Resolve the requested public section from the asynchronous route params.
  const { section } = await params;

  // Reuse the public navigation catalog as the metadata allowlist.
  return createSectionMetadata({
    areaLabel: "Nikharta Roop Salon",
    basePath: "",
    navigationItems: PUBLIC_NAV_ITEMS,
    section,
  });
}

// Render configured public schema domains through one focused placeholder route.
export default async function PublicSectionPage({
  params,
}: PublicSectionPageProps) {
  // Resolve the requested public section from the asynchronous route params.
  const { section } = await params;

  // Reject unknown public sections and render configured ones consistently.
  return (
    <SectionComingSoon
      areaLabel="Nikharta Roop Salon"
      basePath=""
      navigationItems={PUBLIC_NAV_ITEMS}
      section={section}
    />
  );
}
