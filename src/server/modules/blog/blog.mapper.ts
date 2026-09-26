import "server-only";

import type {
  PublicBlogPost,
  PublicCategory,
  PublicComment,
  PublicTag,
} from "./blog.types";

interface PostRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  contentHtml: string | null;
  contentJson: string | null;
  coverImage: string | null;
  readingTime: number;
  views: number;
  published: boolean;
  publishedAt: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  tldr: string | null;
  author: { id: string; name: string | null; avatar: string | null };
  category: PublicCategory | null;
  tags: PublicTag[];
  createdAt: Date;
  updatedAt: Date;
}

interface CommentRow {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  isApproved: boolean;
  createdAt: Date;
  user: { id: string; name: string | null; avatar: string | null };
}

/**
 * Converts a Prisma post row into the public shape.
 *
 * Why:
 * Prisma returns the author as `user` on comments but as `author` on posts.
 * Normalizing to `author` here keeps the client from branching on type.
 */
export function toPublicBlogPost(row: PostRow): PublicBlogPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    contentHtml: row.contentHtml,
    contentJson: row.contentJson,
    coverImage: row.coverImage,
    readingTime: row.readingTime,
    views: row.views,
    published: row.published,
    publishedAt: row.publishedAt,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    metaKeywords: row.metaKeywords,
    canonicalUrl: row.canonicalUrl,
    noIndex: row.noIndex,
    tldr: row.tldr,
    author: row.author,
    category: row.category,
    tags: row.tags,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Converts a Prisma comment row. Renames `user` → `author`. */
export function toPublicComment(row: CommentRow): PublicComment {
  return {
    id: row.id,
    postId: row.postId,
    parentId: row.parentId,
    content: row.content,
    isApproved: row.isApproved,
    createdAt: row.createdAt,
    author: row.user,
  };
}
