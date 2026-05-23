/**
 * Purpose: Public blogs listing page
 * Responsibility: Compose published blog content and category filters
 * Important Notes: Search params are server-handled so filtered URLs are shareable
 */
import type { Metadata } from "next";

import { PublicBlogList } from "@/features/blogs/components/public-blog-list";
import {
  listPublicBlogCategories,
  listPublicBlogs,
} from "@/features/blogs/queries/blog.query";

type BlogsPageProps = {
  searchParams: Promise<{ categorySlug?: string }>;
};

export const metadata: Metadata = {
  title: "Beauty Blogs | Nikharta Roop",
  description:
    "Beauty tips, salon updates, and care guides from Nikharta Roop experts. Discover trends and professional advice for your beauty needs.",
};

/**
 * Loads and renders the public blog catalog.
 */
export default async function BlogsPage({ searchParams }: BlogsPageProps) {
  const { categorySlug } = await searchParams;
  const [categoryResult, blogResult] = await Promise.all([
    listPublicBlogCategories(),
    listPublicBlogs({ categorySlug, limit: 20 }),
  ]);

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
      <ErrorText messages={[categoryResult.error, blogResult.error]} />
      <PublicBlogList
        blogs={blogResult.blogs}
        categories={categoryResult.categories}
        selectedCategorySlug={categorySlug}
      />
    </section>
  );
}

/**
 * Renders partial load errors without blocking available blog content.
 */
function ErrorText({ messages }: { messages: Array<string | null> }) {
  const visibleMessages = messages.filter(Boolean);

  if (visibleMessages.length === 0) return null;

  return (
    <div className="space-y-1 text-sm text-destructive">
      {visibleMessages.map((message) => (
        <p key={message}>{message}</p>
      ))}
    </div>
  );
}
