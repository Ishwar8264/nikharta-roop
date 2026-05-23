/**
 * Purpose: Server-side query helpers for blog admin and public screens.
 * Responsibility: Call blog handlers and normalize response payloads for route composition.
 * Important Notes: Admin calls forward server request headers so handler auth remains centralized.
 */
import "server-only";

import { BlogPostStatus } from "@prisma/client";

import { getDb } from "@/db";
import { createServerApiHeaders } from "@/features/api/server-api-headers";
import {
  handleGetBlogBySlug,
  handleListAdminBlogCategories,
  handleListAdminBlogs,
  handleListBlogCategories,
  handleListBlogs,
} from "@/features/blogs/handlers/blog.handlers";
import type {
  BlogCategoryListResult,
  BlogCategoryOption,
  BlogDetailResult,
  BlogListResult,
  PublicBlogCategory,
  PublicBlogPost,
} from "@/features/blogs/types/blog.types";

type BlogListPayload = {
  data?: {
    blogs?: PublicBlogPost[];
    limit?: number;
  };
  message?: string;
  success?: boolean;
};

type BlogCategoryListPayload = {
  data?: {
    categories?: PublicBlogCategory[];
  };
  message?: string;
  success?: boolean;
};

type BlogDetailPayload = {
  data?: {
    blog?: PublicBlogPost;
  };
  message?: string;
  success?: boolean;
};

type AdminBlogListOptions = {
  categoryId?: string;
  categorySlug?: string;
  limit?: number;
  status?: BlogPostStatus;
};

type PublicBlogListOptions = {
  categorySlug?: string;
  limit?: number;
};

/**
 * Loads published public blog posts.
 */
export async function listPublicBlogs(
  options: PublicBlogListOptions = {},
): Promise<BlogListResult> {
  const url = new URL("http://nikharta-roop.local/api/v1/blogs");

  url.searchParams.set("limit", String(options.limit ?? 20));
  setOptionalParam(url, "categorySlug", options.categorySlug);

  const response = await handleListBlogs(new Request(url, { method: "GET" }));

  return readBlogListPayload(response, "Could not load blog posts.");
}

/**
 * Loads active public blog categories.
 */
export async function listPublicBlogCategories(): Promise<BlogCategoryListResult> {
  const response = await handleListBlogCategories();

  return readBlogCategoryListPayload(response, "Could not load blog categories.");
}

/**
 * Loads one published blog post by slug.
 */
export async function getPublicBlogBySlug(slug: string): Promise<BlogDetailResult> {
  const response = await handleGetBlogBySlug(
    new Request(`http://nikharta-roop.local/api/v1/blogs/${slug}`, {
      method: "GET",
    }),
    slug,
  );

  return readBlogDetailPayload(response, "Could not load blog post.");
}

/**
 * Loads blog posts visible to the authenticated admin.
 */
export async function listAdminBlogs(
  options: AdminBlogListOptions = {},
): Promise<BlogListResult> {
  const url = new URL("http://nikharta-roop.local/api/v1/admin/blogs");

  url.searchParams.set("limit", String(options.limit ?? 100));
  setOptionalParam(url, "categoryId", options.categoryId);
  setOptionalParam(url, "categorySlug", options.categorySlug);
  if (options.status) url.searchParams.set("status", options.status);

  const response = await handleListAdminBlogs(
    new Request(url, {
      headers: await createServerApiHeaders(),
      method: "GET",
    }),
  );

  return readBlogListPayload(response, "Could not load admin blog posts.");
}

/**
 * Loads all blog categories visible to the authenticated admin.
 */
export async function listAdminBlogCategories(): Promise<BlogCategoryListResult> {
  const response = await handleListAdminBlogCategories(
    new Request("http://nikharta-roop.local/api/v1/admin/blogs/categories", {
      headers: await createServerApiHeaders(),
      method: "GET",
    }),
  );

  return readBlogCategoryListPayload(
    response,
    "Could not load admin blog categories.",
  );
}

/**
 * Loads active categories for blog post forms.
 */
export async function listBlogCategoryOptions(): Promise<BlogCategoryOption[]> {
  return getDb().blogCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameHi: "asc" }],
    select: { id: true, nameEn: true, nameHi: true },
    where: { isActive: true },
  });
}

/**
 * Loads one blog post for the admin edit form.
 */
export async function getAdminBlogForEdit(blogId: string) {
  return getDb().blogPost.findUnique({
    select: {
      categoryId: true,
      contentHi: true,
      coverImageUrl: true,
      excerptHi: true,
      id: true,
      publishedAt: true,
      slug: true,
      status: true,
      titleEn: true,
      titleHi: true,
    },
    where: { id: blogId },
  });
}

/**
 * Loads one blog category for the admin edit form.
 */
export async function getAdminBlogCategoryForEdit(categoryId: string) {
  return getDb().blogCategory.findUnique({
    select: {
      description: true,
      id: true,
      isActive: true,
      nameEn: true,
      nameHi: true,
      slug: true,
      sortOrder: true,
    },
    where: { id: categoryId },
  });
}

/**
 * Adds a query param only when a meaningful string exists.
 */
function setOptionalParam(url: URL, key: string, value?: string) {
  if (value) url.searchParams.set(key, value);
}

/**
 * Normalizes list API responses for pages.
 */
async function readBlogListPayload(
  response: Response,
  fallbackMessage: string,
): Promise<BlogListResult> {
  const payload = (await response.json().catch(() => null)) as
    | BlogListPayload
    | null;

  if (!response.ok || payload?.success !== true) {
    return {
      blogs: [],
      error: payload?.message ?? fallbackMessage,
      limit: 0,
    };
  }

  return {
    blogs: payload.data?.blogs ?? [],
    error: null,
    limit: payload.data?.limit ?? 0,
  };
}

/**
 * Normalizes category list API responses for pages.
 */
async function readBlogCategoryListPayload(
  response: Response,
  fallbackMessage: string,
): Promise<BlogCategoryListResult> {
  const payload = (await response.json().catch(() => null)) as
    | BlogCategoryListPayload
    | null;

  if (!response.ok || payload?.success !== true) {
    return {
      categories: [],
      error: payload?.message ?? fallbackMessage,
    };
  }

  return {
    categories: payload.data?.categories ?? [],
    error: null,
  };
}

/**
 * Normalizes detail API responses for pages.
 */
async function readBlogDetailPayload(
  response: Response,
  fallbackMessage: string,
): Promise<BlogDetailResult> {
  const payload = (await response.json().catch(() => null)) as
    | BlogDetailPayload
    | null;

  if (!response.ok || payload?.success !== true) {
    return {
      blog: null,
      error: payload?.message ?? fallbackMessage,
    };
  }

  return {
    blog: payload.data?.blog ?? null,
    error: null,
  };
}
