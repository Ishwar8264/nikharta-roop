/**
 * Purpose: Public blog listing and discovery.
 * Responsibility: Render published blog posts with server-driven category filters.
 * Important Notes: Data is provided by route pages to keep URLs shareable and SEO-friendly.
 */
import Image from "next/image";
import Link from "next/link";
import { Calendar, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  PublicBlogCategory,
  PublicBlogPost,
} from "@/features/blogs/types/blog.types";

type PublicBlogListProps = {
  blogs: PublicBlogPost[];
  categories: PublicBlogCategory[];
  selectedCategorySlug?: string;
};

/**
 * Renders the public blog index with category quick filters.
 */
export function PublicBlogList({
  blogs,
  categories,
  selectedCategorySlug,
}: PublicBlogListProps) {
  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium text-rose-700">Beauty Blog</p>
        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
          Beauty Blogs & Tips
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Discover beauty tips, salon trends, and care guides from Nikharta Roop
          experts.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Button
          asChild
          size="sm"
          variant={!selectedCategorySlug ? "default" : "outline"}
        >
          <Link href="/blogs">All Categories</Link>
        </Button>
        {categories.map((category) => (
          <Button
            asChild
            key={category.id}
            size="sm"
            variant={selectedCategorySlug === category.slug ? "default" : "outline"}
          >
            <Link href={`/blogs?categorySlug=${category.slug}`}>
              {category.nameHi}
            </Link>
          </Button>
        ))}
      </div>

      {blogs.length === 0 ? (
        <div className="rounded-md border bg-white p-6 text-sm text-muted-foreground">
          No blogs are published for this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <BlogPreviewCard blog={blog} key={blog.id} />
          ))}
        </div>
      )}
    </div>
  );
}

type BlogPreviewCardProps = {
  blog: PublicBlogPost;
};

/**
 * Renders a compact public blog preview card.
 */
function BlogPreviewCard({ blog }: BlogPreviewCardProps) {
  return (
    <Link className="group block h-full" href={`/blogs/${blog.slug}`}>
      <Card className="h-full overflow-hidden border-stone-200 bg-white transition-shadow group-hover:shadow-md">
        {blog.coverImageUrl ? (
          <div className="relative h-48 w-full bg-stone-100">
            <Image
              alt={blog.titleHi}
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              src={blog.coverImageUrl}
            />
          </div>
        ) : null}
        <CardContent className="space-y-3 p-4">
          <Badge className="w-fit" variant="secondary">
            {blog.category.nameHi}
          </Badge>
          <h2 className="line-clamp-2 font-heading text-lg font-semibold">
            {blog.titleHi}
          </h2>
          {blog.excerptHi ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {blog.excerptHi}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-4 border-t pt-3 text-xs text-muted-foreground">
            {blog.publishedAt ? (
              <span className="flex items-center gap-1">
                <Calendar className="size-4" />
                {formatBlogDate(blog.publishedAt)}
              </span>
            ) : null}
            {blog.author?.name ? (
              <span className="flex items-center gap-1">
                <User className="size-4" />
                {blog.author.name}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Formats serialized API dates for Indian readers.
 */
function formatBlogDate(value: string) {
  return new Date(value).toLocaleDateString("hi-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
