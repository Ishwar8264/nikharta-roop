// Load admin navigation as the allowlist for branch management sections.
import { ADMIN_NAV_ITEMS } from "@/src/components/navigation/navigation.config";
// Load the reusable validated placeholder and its metadata helper.
import {
  createSectionMetadata,
  SectionComingSoon,
} from "@/src/components/shared/section-coming-soon";

// Describe the asynchronous admin section supplied by Next.js 16.
type AdminSectionPageProps = {
  // Await the administration route segment before validating it against navigation.
  params: Promise<{ section: string }>;
};

// Build browser metadata only for configured administration sections.
export async function generateMetadata({ params }: AdminSectionPageProps) {
  // Resolve the requested admin section from asynchronous route params.
  const { section } = await params;

  // Reuse admin navigation as the metadata allowlist.
  return createSectionMetadata({
    areaLabel: "Admin Area",
    basePath: "/admin",
    navigationItems: ADMIN_NAV_ITEMS,
    section,
  });
}

// Render configured admin schema domains through one protected placeholder route.
export default async function AdminSectionPage({
  params,
}: AdminSectionPageProps) {
  // Resolve the requested admin section from asynchronous route params.
  const { section } = await params;

  // Render only sections configured for branch administration.
  return (
    <SectionComingSoon
      areaLabel="Admin Area"
      basePath="/admin"
      navigationItems={ADMIN_NAV_ITEMS}
      section={section}
    />
  );
}
