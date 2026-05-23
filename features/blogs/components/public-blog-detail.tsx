/**
 * Purpose: Public blog detail presentation.
 * Responsibility: Render a fully loaded published blog post.
 * Important Notes: Fetching is handled by the route page for SEO and not-found behavior.
 */
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PublicBlogPost } from "@/features/blogs/types/blog.types";

type PublicBlogDetailProps = {
  blog: PublicBlogPost;
};

/**
 * Renders one public blog article.
 */
export function PublicBlogDetail({ blog }: PublicBlogDetailProps) {
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Button asChild className="-ml-2 w-fit" size="sm" variant="ghost">
        <Link href="/blogs">
          <ArrowLeft className="size-4" />
          Back to Blogs
        </Link>
      </Button>

      {blog.coverImageUrl ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-stone-100">
          <Image
            alt={blog.titleHi}
            className="object-cover"
            fill
            priority
            sizes="(min-width: 768px) 768px, 100vw"
            src={blog.coverImageUrl}
          />
        </div>
      ) : null}

      <header className="space-y-4">
        <Badge className="w-fit" variant="secondary">
          {blog.category.nameHi}
        </Badge>
        <div>
          <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
            {blog.titleHi}
          </h1>
          {blog.titleEn ? (
            <p className="mt-2 text-lg text-muted-foreground">{blog.titleEn}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-4 border-b pb-4 text-sm text-muted-foreground">
          {blog.publishedAt ? (
            <time className="flex items-center gap-2" dateTime={blog.publishedAt}>
              <Calendar className="size-4" />
              {formatBlogDate(blog.publishedAt)}
            </time>
          ) : null}
          {blog.author?.name ? (
            <span className="flex items-center gap-2">
              <User className="size-4" />
              {blog.author.name}
            </span>
          ) : null}
          <Link
            className="font-medium text-rose-700 hover:text-rose-800"
            href={`/blogs?categorySlug=${blog.category.slug}`}
          >
            {blog.category.nameHi}
          </Link>
        </div>

        {blog.excerptHi ? (
          <p className="text-lg leading-8 text-muted-foreground">{blog.excerptHi}</p>
        ) : null}
      </header>

      <div className="space-y-4 text-base leading-8 text-stone-800">
        {blog.contentHi.split(/\n{2,}/).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}

/**
 * Formats serialized API dates for Indian readers.
 */
function formatBlogDate(value: string) {
  return new Date(value).toLocaleDateString("hi-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
