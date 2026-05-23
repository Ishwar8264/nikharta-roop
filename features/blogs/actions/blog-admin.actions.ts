/**
 * Purpose: Server actions for admin blog management forms and destructive actions.
 * Responsibility: Forward typed admin writes through blog handlers and refresh affected routes.
 * Important Notes: Handlers remain the single source for auth, validation, and response contracts.
 */
"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/features/api/server-action-auth";
import { createServerApiHeaders } from "@/features/api/server-api-headers";
import {
  handleCreateBlogCategory,
  handleCreateBlogPost,
  handleDeleteBlogCategory,
  handleDeleteBlogPost,
  handleUpdateBlogCategory,
  handleUpdateBlogPost,
} from "@/features/blogs/handlers/blog.handlers";
import type { BlogActionState } from "@/features/blogs/types/blog.types";
import type {
  CreateBlogCategoryInput,
  CreateBlogPostInput,
  UpdateBlogCategoryInput,
  UpdateBlogPostInput,
} from "@/schema/blogs/schema.blog";

type BlogActionPayload = {
  message?: string;
  success?: boolean;
};

/**
 * Creates a blog post through POST /api/v1/admin/blogs.
 */
export async function createBlogPostAction(
  input: CreateBlogPostInput,
): Promise<BlogActionState> {
  const auth = await requireAuth();

  if (!auth.success) {
    return { message: auth.message, success: false };
  }

  const response = await handleCreateBlogPost(
    new Request("http://nikharta-roop.local/api/v1/admin/blogs", {
      body: JSON.stringify(input),
      headers: await createServerApiHeaders(),
      method: "POST",
    }),
  );

  return handleBlogActionResponse(response, {
    fallbackMessage: "Could not create blog post.",
    revalidatePaths: ["/admin/blogs", "/blogs"],
  });
}

/**
 * Updates a blog post through PATCH /api/v1/admin/blogs/:blogId.
 */
export async function updateBlogPostAction(
  blogId: string,
  input: UpdateBlogPostInput,
): Promise<BlogActionState> {
  const auth = await requireAuth();

  if (!auth.success) {
    return { message: auth.message, success: false };
  }

  const response = await handleUpdateBlogPost(
    new Request(`http://nikharta-roop.local/api/v1/admin/blogs/${blogId}`, {
      body: JSON.stringify(input),
      headers: await createServerApiHeaders(),
      method: "PATCH",
    }),
    blogId,
  );

  return handleBlogActionResponse(response, {
    fallbackMessage: "Could not update blog post.",
    revalidatePaths: ["/admin/blogs", "/blogs", `/blogs/${input.slug ?? ""}`],
  });
}

/**
 * Deletes a blog post through DELETE /api/v1/admin/blogs/:blogId.
 */
export async function deleteBlogPostAction(
  blogId: string,
): Promise<BlogActionState> {
  const auth = await requireAuth();

  if (!auth.success) {
    return { message: auth.message, success: false };
  }

  const response = await handleDeleteBlogPost(
    new Request(`http://nikharta-roop.local/api/v1/admin/blogs/${blogId}`, {
      headers: await createServerApiHeaders(),
      method: "DELETE",
    }),
    blogId,
  );

  return handleBlogActionResponse(response, {
    fallbackMessage: "Could not delete blog post.",
    revalidatePaths: ["/admin/blogs", "/blogs"],
  });
}

/**
 * Creates a blog category through POST /api/v1/admin/blogs/categories.
 */
export async function createBlogCategoryAction(
  input: CreateBlogCategoryInput,
): Promise<BlogActionState> {
  const auth = await requireAuth();

  if (!auth.success) {
    return { message: auth.message, success: false };
  }

  const response = await handleCreateBlogCategory(
    new Request("http://nikharta-roop.local/api/v1/admin/blogs/categories", {
      body: JSON.stringify(input),
      headers: await createServerApiHeaders(),
      method: "POST",
    }),
  );

  return handleBlogActionResponse(response, {
    fallbackMessage: "Could not create blog category.",
    revalidatePaths: ["/admin/blogs", "/blogs"],
  });
}

/**
 * Updates a blog category through PATCH /api/v1/admin/blogs/categories/:categoryId.
 */
export async function updateBlogCategoryAction(
  categoryId: string,
  input: UpdateBlogCategoryInput,
): Promise<BlogActionState> {
  const auth = await requireAuth();

  if (!auth.success) {
    return { message: auth.message, success: false };
  }

  const response = await handleUpdateBlogCategory(
    new Request(
      `http://nikharta-roop.local/api/v1/admin/blogs/categories/${categoryId}`,
      {
        body: JSON.stringify(input),
        headers: await createServerApiHeaders(),
        method: "PATCH",
      },
    ),
    categoryId,
  );

  return handleBlogActionResponse(response, {
    fallbackMessage: "Could not update blog category.",
    revalidatePaths: ["/admin/blogs", "/blogs"],
  });
}

/**
 * Deletes a blog category through DELETE /api/v1/admin/blogs/categories/:categoryId.
 */
export async function deleteBlogCategoryAction(
  categoryId: string,
): Promise<BlogActionState> {
  const auth = await requireAuth();

  if (!auth.success) {
    return { message: auth.message, success: false };
  }

  const response = await handleDeleteBlogCategory(
    new Request(
      `http://nikharta-roop.local/api/v1/admin/blogs/categories/${categoryId}`,
      {
        headers: await createServerApiHeaders(),
        method: "DELETE",
      },
    ),
    categoryId,
  );

  return handleBlogActionResponse(response, {
    fallbackMessage: "Could not delete blog category.",
    revalidatePaths: ["/admin/blogs", "/blogs"],
  });
}

/**
 * Handles success revalidation and handler validation failures.
 */
async function handleBlogActionResponse(
  response: Response,
  input: {
    fallbackMessage: string;
    revalidatePaths: string[];
  },
): Promise<BlogActionState> {
  const payload = (await response.json().catch(() => null)) as
    | BlogActionPayload
    | null;

  if (response.ok && payload?.success === true) {
    for (const path of input.revalidatePaths) {
      if (!path.endsWith("/")) revalidatePath(path);
    }

    return {
      message: payload.message ?? "Blog action completed.",
      success: true,
    };
  }

  return {
    message: payload?.message ?? input.fallbackMessage,
    success: false,
  };
}
