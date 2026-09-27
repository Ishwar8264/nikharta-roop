import { ComingSoon } from "@/components/shared/coming-soon";
import { comingSoonPages } from "@/config/coming-soon";
import { routes } from "@/config/routes";

/** Shows the upcoming blog article experience. */
export default function BlogPostPage() {
  return (
    <ComingSoon
      {...comingSoonPages.blogPost}
      backHref={routes.blog}
      backLabel="Back to blog"
    />
  );
}
