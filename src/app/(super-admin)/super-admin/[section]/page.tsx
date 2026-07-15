// Load owner navigation as the allowlist for full-access sections.
import { SUPER_ADMIN_NAV_ITEMS } from "@/src/components/navigation/navigation.config";
// Load the reusable validated placeholder and its metadata helper.
import {
  createSectionMetadata,
  SectionComingSoon,
} from "@/src/components/shared/section-coming-soon";

// Describe the asynchronous owner section supplied by Next.js 16.
type SuperAdminSectionPageProps = {
  // Await the owner route segment before validating it against navigation.
  params: Promise<{ section: string }>;
};

// Build browser metadata only for configured owner navigation sections.
export async function generateMetadata({
  params,
}: SuperAdminSectionPageProps) {
  // Resolve the requested owner section from asynchronous route params.
  const { section } = await params;

  // Reuse owner navigation as the metadata allowlist.
  return createSectionMetadata({
    areaLabel: "Super Admin",
    basePath: "/super-admin",
    navigationItems: SUPER_ADMIN_NAV_ITEMS,
    section,
  });
}

// Render configured owner schema domains through one protected placeholder route.
export default async function SuperAdminSectionPage({
  params,
}: SuperAdminSectionPageProps) {
  // Resolve the requested owner section from asynchronous route params.
  const { section } = await params;

  // Render only sections configured for owner-level access.
  return (
    <SectionComingSoon
      areaLabel="Super Admin"
      basePath="/super-admin"
      navigationItems={SUPER_ADMIN_NAV_ITEMS}
      section={section}
    />
  );
}
