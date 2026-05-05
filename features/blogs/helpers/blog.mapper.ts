export type BlogCategoryRow = {
  createdAt: Date;
  description: string | null;
  id: string;
  isActive: boolean;
  nameEn: string | null;
  nameHi: string;
  slug: string;
  sortOrder: number;
  updatedAt: Date;
};

export type BlogPostRow = {
  author: { id: string; name: string | null } | null;
  authorId: string | null;
  category: BlogCategoryRow;
  categoryId: string;
  contentHi: string;
  coverImageUrl: string | null;
  createdAt: Date;
  excerptHi: string | null;
  id: string;
  publishedAt: Date | null;
  slug: string;
  status: string;
  titleEn: string | null;
  titleHi: string;
  updatedAt: Date;
};

/**
 * Converts a blog category row into the public API shape.
 */
export function toPublicBlogCategory(category: BlogCategoryRow) {
  return category;
}

/**
 * Converts a blog post row into the public API shape.
 */
export function toPublicBlogPost(post: BlogPostRow) {
  return {
    ...post,
    category: toPublicBlogCategory(post.category),
  };
}
