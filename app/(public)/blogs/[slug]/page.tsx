/**
 * Purpose: Public blog detail page
 * Responsibility: Compose one published blog post
 * Important Notes: Public detail loads only published posts from active categories
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicBlogDetail } from "@/features/blogs/components/public-blog-detail";
import { getPublicBlogBySlug } from "@/features/blogs/queries/blog.query";

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { blog } = await getPublicBlogBySlug(slug);

  if (!blog) {
    return {
      title: "Blog Not Found | Nikharta Roop",
    };
  }

  return {
    title: `${blog.titleHi} | Nikharta Roop`,
    description: blog.excerptHi || `Read more about ${blog.titleHi} on Nikharta Roop`,
    openGraph: {
      title: blog.titleHi,
      description: blog.excerptHi || undefined,
      images: blog.coverImageUrl ? [{ url: blog.coverImageUrl }] : [],
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const { blog } = await getPublicBlogBySlug(slug);

  if (!blog) notFound();

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PublicBlogDetail blog={blog} />
    </section>
  );
}
