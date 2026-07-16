// Load staff navigation as the allowlist for operational sections.
import { STAFF_NAV_ITEMS } from "@/src/components/navigation/navigation.config";
// Load the reusable validated placeholder and its metadata helper.
import {
  createSectionMetadata,
  SectionComingSoon,
} from "@/src/components/shared/section-coming-soon";

// Describe the asynchronous staff section supplied by Next.js 16.
type StaffSectionPageProps = {
  // Await the operational route segment before validating it against navigation.
  params: Promise<{ section: string }>;
};

// Build browser metadata only for configured staff navigation sections.
export async function generateMetadata({ params }: StaffSectionPageProps) {
  // Resolve the requested staff section from asynchronous route params.
  const { section } = await params;

  // Reuse staff navigation as the metadata allowlist.
  return createSectionMetadata({
    areaLabel: "Staff Workspace",
    basePath: "/staff",
    navigationItems: STAFF_NAV_ITEMS,
    section,
  });
}

// Render configured staff schema domains through one protected placeholder route.
export default async function StaffSectionPage({
  params,
}: StaffSectionPageProps) {
  // Resolve the requested staff section from asynchronous route params.
  const { section } = await params;

  // Render only sections configured for staff operations.
  return (
    <SectionComingSoon
      areaLabel="Staff Workspace"
      basePath="/staff"
      navigationItems={STAFF_NAV_ITEMS}
      section={section}
    />
  );
}
