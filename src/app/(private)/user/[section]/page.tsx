// Load customer navigation as the allowlist for dynamic private sections.
import { PRIVATE_NAV_ITEMS } from "@/src/components/navigation/navigation.config";
// Load the reusable validated placeholder and its metadata helper.
import {
  createSectionMetadata,
  SectionComingSoon,
} from "@/src/components/shared/section-coming-soon";

// Describe the asynchronous customer section supplied by Next.js 16.
type UserSectionPageProps = {
  // Await the customer route segment before validating it against navigation.
  params: Promise<{ section: string }>;
};

// Build browser metadata only for configured customer navigation sections.
export async function generateMetadata({ params }: UserSectionPageProps) {
  // Resolve the requested customer section from asynchronous route params.
  const { section } = await params;

  // Reuse customer navigation as the metadata allowlist.
  return createSectionMetadata({
    areaLabel: "Customer Area",
    basePath: "/user",
    navigationItems: PRIVATE_NAV_ITEMS,
    section,
  });
}

// Render configured customer schema domains through one protected placeholder route.
export default async function UserSectionPage({
  params,
}: UserSectionPageProps) {
  // Resolve the requested customer section from asynchronous route params.
  const { section } = await params;

  // Render only sections configured for regular customer navigation.
  return (
    <SectionComingSoon
      areaLabel="Customer Area"
      basePath="/user"
      navigationItems={PRIVATE_NAV_ITEMS}
      section={section}
    />
  );
}
