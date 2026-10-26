import { ComingSoon } from "@/components/shared/coming-soon";
import { comingSoonPages } from "@/config/coming-soon";

/** Shows the upcoming editorial experience. */
export default function BlogPage() {
  return <ComingSoon {...comingSoonPages.blog} />;
}
