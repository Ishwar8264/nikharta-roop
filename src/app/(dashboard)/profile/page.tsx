import { ComingSoon } from "@/components/shared/coming-soon";
import { comingSoonPages } from "@/config/coming-soon";

/** Shows the upcoming profile experience. */
export default function ProfilePage() {
  return <ComingSoon {...comingSoonPages.profile} />;
}
