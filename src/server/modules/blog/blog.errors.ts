/** Thrown when a blog post does not exist or is not visible to the caller. */
export class BlogPostNotFoundError extends Error {
  constructor() {
    super("Blog post not found");
    this.name = "BlogPostNotFoundError";
  }
}

/** Thrown when the caller is not a SUPER_ADMIN for a write operation. */
export class BlogPostAccessDeniedError extends Error {
  constructor() {
    super("Only platform administrators can manage blog posts");
    this.name = "BlogPostAccessDeniedError";
  }
}

/** Thrown when a blog comment does not exist. */
export class BlogCommentNotFoundError extends Error {
  constructor() {
    super("Blog comment not found");
    this.name = "BlogCommentNotFoundError";
  }
}

/** Thrown when the caller does not own the comment and is not an admin. */
export class BlogCommentAccessDeniedError extends Error {
  constructor() {
    super("You can only modify your own comments");
    this.name = "BlogCommentAccessDeniedError";
  }
}

/** Thrown when a blog category does not exist. */
export class BlogCategoryNotFoundError extends Error {
  constructor() {
    super("Blog category not found");
    this.name = "BlogCategoryNotFoundError";
  }
}

/** Thrown when a category slug is already taken. */
export class BlogCategorySlugConflictError extends Error {
  constructor() {
    super("A category with this slug already exists");
    this.name = "BlogCategorySlugConflictError";
  }
}

/** Thrown when a post slug cannot be made unique. */
export class BlogPostSlugConflictError extends Error {
  constructor() {
    super("A post with this slug already exists");
    this.name = "BlogPostSlugConflictError";
  }
}

/** Thrown when a comment's parent does not belong to the same post. */
export class BlogCommentParentInvalidError extends Error {
  constructor() {
    super("Reply target must be a top-level comment on the same post");
    this.name = "BlogCommentParentInvalidError";
  }
}
