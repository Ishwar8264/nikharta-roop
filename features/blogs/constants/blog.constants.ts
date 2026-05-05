/**
 * Stable machine-readable codes returned by blog API responses.
 */
export const BLOG_CODES = {
  BLOG_CATEGORY_CREATED: "BLOG_CATEGORY_CREATED",
  BLOG_CATEGORY_CREATE_FAILED: "BLOG_CATEGORY_CREATE_FAILED",
  BLOG_CATEGORY_NOT_FOUND: "BLOG_CATEGORY_NOT_FOUND",
  BLOG_CATEGORY_UPDATED: "BLOG_CATEGORY_UPDATED",
  BLOG_CATEGORY_UPDATE_FAILED: "BLOG_CATEGORY_UPDATE_FAILED",
  BLOG_CREATED: "BLOG_CREATED",
  BLOG_CREATE_FAILED: "BLOG_CREATE_FAILED",
  BLOG_DELETED: "BLOG_DELETED",
  BLOG_DELETE_FAILED: "BLOG_DELETE_FAILED",
  BLOG_LOADED: "BLOG_LOADED",
  BLOG_LOAD_FAILED: "BLOG_LOAD_FAILED",
  BLOG_NOT_FOUND: "BLOG_NOT_FOUND",
  BLOG_UPDATED: "BLOG_UPDATED",
  BLOG_UPDATE_FAILED: "BLOG_UPDATE_FAILED",
  BLOGS_LISTED: "BLOGS_LISTED",
  BLOGS_LOAD_FAILED: "BLOGS_LOAD_FAILED",
  CATEGORIES_LISTED: "BLOG_CATEGORIES_LISTED",
  FORBIDDEN: "BLOG_FORBIDDEN",
  SLUG_DUPLICATE: "BLOG_SLUG_DUPLICATE",
  VALIDATION_ERROR: "BLOG_VALIDATION_ERROR",
} as const;

/**
 * User-safe messages paired with blog response codes.
 */
export const BLOG_MESSAGES = {
  BLOG_CATEGORY_CREATED: "Blog category created successfully.",
  BLOG_CATEGORY_CREATE_FAILED: "Could not create blog category.",
  BLOG_CATEGORY_NOT_FOUND: "Blog category was not found.",
  BLOG_CATEGORY_UPDATED: "Blog category updated successfully.",
  BLOG_CATEGORY_UPDATE_FAILED: "Could not update blog category.",
  BLOG_CREATED: "Blog post created successfully.",
  BLOG_CREATE_FAILED: "Could not create blog post.",
  BLOG_DELETED: "Blog post deleted successfully.",
  BLOG_DELETE_FAILED: "Could not delete blog post.",
  BLOG_LOADED: "Blog post loaded successfully.",
  BLOG_LOAD_FAILED: "Could not load blog post.",
  BLOG_NOT_FOUND: "Blog post was not found.",
  BLOG_UPDATED: "Blog post updated successfully.",
  BLOG_UPDATE_FAILED: "Could not update blog post.",
  BLOGS_LISTED: "Blog posts loaded successfully.",
  BLOGS_LOAD_FAILED: "Could not load blog posts.",
  CATEGORIES_LISTED: "Blog categories loaded successfully.",
  FORBIDDEN: "You do not have permission to manage blog content.",
  SLUG_DUPLICATE: "This blog slug is already in use.",
  VALIDATION_ERROR: "Please check the blog request and try again.",
} as const;
