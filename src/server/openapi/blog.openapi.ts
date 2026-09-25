import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

const authenticatedMutation: OpenAPIV3.SecurityRequirementObject[] = [
  { bearerAuth: [] },
  { accessCookie: [], csrfToken: [] },
];
const validationResponse: OpenAPIV3.ResponseObject = {
  description: "Malformed JSON or validation failure",
  content: {
    "application/json": {
      schema: {
        oneOf: [
          { $ref: "#/components/schemas/ErrorResponse" },
          { $ref: "#/components/schemas/ValidationErrorResponse" },
        ],
      },
    },
  },
};

function errorResponse(description: string): OpenAPIV3.ResponseObject {
  return {
    description,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  };
}

function idParameter(name: string): OpenAPIV3.ParameterObject {
  return {
    name,
    in: "path",
    required: true,
    schema: { $ref: "#/components/schemas/ResourceId" },
  };
}

/** OpenAPI paths exposed by the blog module. */
export const blogPaths = {
  "/api/v1/blog/posts": {
    get: {
      tags: ["Blog"],
      summary: "List published blog posts",
      operationId: "listBlogPosts",
      security: [],
      parameters: [
        { $ref: "#/components/parameters/CursorParam" },
        { $ref: "#/components/parameters/LimitParam" },
        {
          name: "category",
          in: "query",
          schema: { type: "string", maxLength: 120 },
          description: "Category slug filter.",
        },
        {
          name: "tag",
          in: "query",
          schema: { type: "string", maxLength: 120 },
          description: "Tag slug filter.",
        },
        {
          name: "search",
          in: "query",
          schema: { type: "string", minLength: 2, maxLength: 80 },
          description: "Case-insensitive match on title or excerpt.",
        },
      ],
      responses: {
        "200": {
          description: "Paginated list of published posts",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BlogPostListResponse" },
            },
          },
        },
        "400": validationResponse,
      },
    },
    post: {
      tags: ["Blog"],
      summary: "Create a blog post draft",
      description:
        "Persists a new post as a draft. Publishing is a separate action. " +
        "Requires SUPER_ADMIN.",
      operationId: "createBlogPostDraft",
      security: authenticatedMutation,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateBlogPostRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Draft created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BlogPostResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Requires SUPER_ADMIN"),
        "404": errorResponse("Category not found"),
        "409": errorResponse("Post slug already exists"),
      },
    },
  },
  "/api/v1/blog/posts/{postRef}": {
    get: {
      tags: ["Blog"],
      summary: "Get a published blog post by slug",
      operationId: "getBlogPostBySlug",
      security: [],
      parameters: [
        {
          name: "postRef",
          in: "path",
          required: true,
          schema: { type: "string", maxLength: 120 },
          description: "Post slug",
        },
      ],
      responses: {
        "200": {
          description: "Post detail",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BlogPostResponse" },
            },
          },
        },
        "400": validationResponse,
        "404": errorResponse("Published post not found"),
      },
    },
    patch: {
      tags: ["Blog"],
      summary: "Update a blog post",
      description: "Requires SUPER_ADMIN. Post id, not slug.",
      operationId: "updateBlogPost",
      security: authenticatedMutation,
      parameters: [idParameter("postRef")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateBlogPostRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Post updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BlogPostResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Requires SUPER_ADMIN"),
        "404": errorResponse("Post or category not found"),
        "409": errorResponse("Post slug already exists"),
      },
    },
    delete: {
      tags: ["Blog"],
      summary: "Soft-delete a blog post",
      description: "Requires SUPER_ADMIN. Post id, not slug.",
      operationId: "deleteBlogPost",
      security: authenticatedMutation,
      parameters: [idParameter("postRef")],
      responses: {
        "200": {
          description: "Post deleted",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuccessResponse" },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Requires SUPER_ADMIN"),
        "404": errorResponse("Post not found"),
      },
    },
  },
  "/api/v1/blog/posts/{postRef}/publish": {
    post: {
      tags: ["Blog"],
      summary: "Publish or unpublish a post",
      description:
        "Toggles the `published` flag. Setting `publishedAt` on first " +
        "publish; clearing it on unpublish. Requires SUPER_ADMIN.",
      operationId: "toggleBlogPostPublish",
      security: authenticatedMutation,
      parameters: [idParameter("postRef")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PublishBlogPostRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Publish state changed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BlogPostResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Requires SUPER_ADMIN"),
        "404": errorResponse("Post not found"),
      },
    },
  },
  "/api/v1/blog/posts/{postRef}/comments": {
    get: {
      tags: ["Blog"],
      summary: "List approved comments on a published post",
      operationId: "listBlogComments",
      security: [],
      parameters: [
        {
          name: "postRef",
          in: "path",
          required: true,
          schema: { type: "string", maxLength: 120 },
          description: "Post slug",
        },
        { $ref: "#/components/parameters/CursorParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": {
          description: "Paginated comments",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BlogCommentListResponse" },
            },
          },
        },
        "400": validationResponse,
        "404": errorResponse("Published post not found"),
      },
    },
    post: {
      tags: ["Blog"],
      summary: "Add a comment on a published post",
      description:
        "Any authenticated user. `parentId` must be a top-level comment " +
        "on the same post — replies are one level deep.",
      operationId: "createBlogComment",
      security: authenticatedMutation,
      parameters: [
        {
          name: "postRef",
          in: "path",
          required: true,
          schema: { type: "string", maxLength: 120 },
          description: "Post slug",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateBlogCommentRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Comment added",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BlogCommentResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": errorResponse("Published post not found"),
      },
    },
  },
  "/api/v1/blog/comments/{commentId}": {
    patch: {
      tags: ["Blog"],
      summary: "Update a comment or flip its approval",
      description:
        "Authors may edit their own content. SUPER_ADMIN may flip " +
        "`isApproved` to hide or unhide a comment.",
      operationId: "updateBlogComment",
      security: authenticatedMutation,
      parameters: [idParameter("commentId")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateBlogCommentRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Comment updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BlogCommentResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Not the author and not an admin"),
        "404": errorResponse("Comment not found"),
      },
    },
    delete: {
      tags: ["Blog"],
      summary: "Delete a comment",
      description: "Authors may delete their own. SUPER_ADMIN may delete any.",
      operationId: "deleteBlogComment",
      security: authenticatedMutation,
      parameters: [idParameter("commentId")],
      responses: {
        "200": {
          description: "Comment deleted",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuccessResponse" },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Not the author and not an admin"),
        "404": errorResponse("Comment not found"),
      },
    },
  },
  "/api/v1/blog/categories": {
    get: {
      tags: ["Blog"],
      summary: "List blog categories",
      operationId: "listBlogCategories",
      security: [],
      parameters: [
        { $ref: "#/components/parameters/CursorParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": {
          description: "Paginated categories",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BlogCategoryListResponse" },
            },
          },
        },
      },
    },
    post: {
      tags: ["Blog"],
      summary: "Create a blog category",
      description: "Requires SUPER_ADMIN.",
      operationId: "createBlogCategory",
      security: authenticatedMutation,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateBlogCategoryRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Category created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BlogCategoryResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Requires SUPER_ADMIN"),
        "409": errorResponse("Category slug already exists"),
      },
    },
  },
  "/api/v1/blog/tags": {
    get: {
      tags: ["Blog"],
      summary: "List blog tags",
      description:
        "Tags are created implicitly when posts reference new names.",
      operationId: "listBlogTags",
      security: [],
      parameters: [
        { $ref: "#/components/parameters/CursorParam" },
        { $ref: "#/components/parameters/LimitParam" },
      ],
      responses: {
        "200": {
          description: "Paginated tags",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BlogTagListResponse" },
            },
          },
        },
      },
    },
  },
} as unknown as OpenAPIV3_1.PathsObject;

const blogAuthorSchema: OpenAPIV3_1.SchemaObject = {
  type: "object",
  required: ["id", "name", "avatar"],
  properties: {
    id: { $ref: "#/components/schemas/ResourceId" },
    name: { type: ["string", "null"] },
    avatar: { type: ["string", "null"], format: "uri" },
  },
};

const blogTagSchema: OpenAPIV3_1.SchemaObject = {
  type: "object",
  required: ["id", "name", "slug"],
  properties: {
    id: { $ref: "#/components/schemas/ResourceId" },
    name: { type: "string" },
    slug: { type: "string" },
  },
};

const blogCategorySchema: OpenAPIV3_1.SchemaObject = {
  type: "object",
  required: ["id", "name", "slug", "description", "seoTitle", "seoDescription"],
  properties: {
    id: { $ref: "#/components/schemas/ResourceId" },
    name: { type: "string" },
    slug: { type: "string" },
    description: { type: ["string", "null"] },
    seoTitle: { type: ["string", "null"] },
    seoDescription: { type: ["string", "null"] },
  },
};

/** Reusable OpenAPI schemas exposed by the blog module. */
export const blogSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
  BlogAuthor: blogAuthorSchema,
  BlogTag: blogTagSchema,
  BlogCategory: blogCategorySchema,
  BlogPost: {
    type: "object",
    required: [
      "id",
      "title",
      "slug",
      "excerpt",
      "content",
      "contentHtml",
      "contentJson",
      "coverImage",
      "readingTime",
      "views",
      "published",
      "publishedAt",
      "seoTitle",
      "seoDescription",
      "metaKeywords",
      "canonicalUrl",
      "noIndex",
      "tldr",
      "author",
      "category",
      "tags",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { $ref: "#/components/schemas/ResourceId" },
      title: { type: "string" },
      slug: { type: "string" },
      excerpt: { type: ["string", "null"] },
      content: { type: "string" },
      contentHtml: { type: ["string", "null"] },
      contentJson: { type: ["string", "null"] },
      coverImage: { type: ["string", "null"], format: "uri" },
      readingTime: { type: "integer", minimum: 1 },
      views: { type: "integer", minimum: 0 },
      published: { type: "boolean" },
      publishedAt: { type: ["string", "null"], format: "date-time" },
      seoTitle: { type: ["string", "null"] },
      seoDescription: { type: ["string", "null"] },
      metaKeywords: { type: ["string", "null"] },
      canonicalUrl: { type: ["string", "null"], format: "uri" },
      noIndex: { type: "boolean" },
      tldr: { type: ["string", "null"] },
      author: { $ref: "#/components/schemas/BlogAuthor" },
      category: {
        oneOf: [
          { $ref: "#/components/schemas/BlogCategory" },
          { type: "null" },
        ],
      },
      tags: {
        type: "array",
        items: { $ref: "#/components/schemas/BlogTag" },
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  BlogComment: {
    type: "object",
    required: [
      "id",
      "postId",
      "parentId",
      "content",
      "isApproved",
      "createdAt",
      "author",
    ],
    properties: {
      id: { $ref: "#/components/schemas/ResourceId" },
      postId: { $ref: "#/components/schemas/ResourceId" },
      parentId: {
        oneOf: [{ $ref: "#/components/schemas/ResourceId" }, { type: "null" }],
      },
      content: { type: "string" },
      isApproved: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      author: { $ref: "#/components/schemas/BlogAuthor" },
    },
  },
  CreateBlogPostRequest: {
    type: "object",
    additionalProperties: false,
    required: ["title", "content"],
    properties: {
      title: { type: "string", minLength: 3, maxLength: 200 },
      slug: {
        type: "string",
        pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
        minLength: 2,
        maxLength: 120,
      },
      excerpt: { type: "string", maxLength: 500 },
      content: { type: "string", minLength: 1, maxLength: 200000 },
      contentHtml: { type: "string" },
      contentJson: { type: "string" },
      coverImage: { type: "string", format: "uri", maxLength: 2048 },
      categoryId: { $ref: "#/components/schemas/ResourceId" },
      tags: {
        type: "array",
        maxItems: 20,
        default: [],
        items: { type: "string", minLength: 1, maxLength: 60 },
      },
      seoTitle: { type: "string", maxLength: 70 },
      seoDescription: { type: "string", maxLength: 160 },
      metaKeywords: { type: "string", maxLength: 255 },
      canonicalUrl: { type: "string", format: "uri", maxLength: 2048 },
      noIndex: { type: "boolean", default: false },
      tldr: { type: "string", maxLength: 500 },
    },
  },
  UpdateBlogPostRequest: {
    type: "object",
    additionalProperties: false,
    minProperties: 1,
    properties: {
      title: { type: "string", minLength: 3, maxLength: 200 },
      slug: {
        type: "string",
        pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
        minLength: 2,
        maxLength: 120,
      },
      excerpt: { type: ["string", "null"], maxLength: 500 },
      content: { type: "string", minLength: 1, maxLength: 200000 },
      contentHtml: { type: ["string", "null"] },
      contentJson: { type: ["string", "null"] },
      coverImage: {
        type: ["string", "null"],
        format: "uri",
        maxLength: 2048,
      },
      categoryId: {
        oneOf: [{ $ref: "#/components/schemas/ResourceId" }, { type: "null" }],
      },
      tags: {
        type: "array",
        maxItems: 20,
        items: { type: "string", minLength: 1, maxLength: 60 },
      },
      seoTitle: { type: ["string", "null"], maxLength: 70 },
      seoDescription: { type: ["string", "null"], maxLength: 160 },
      metaKeywords: { type: ["string", "null"], maxLength: 255 },
      canonicalUrl: {
        type: ["string", "null"],
        format: "uri",
        maxLength: 2048,
      },
      noIndex: { type: "boolean" },
      tldr: { type: ["string", "null"], maxLength: 500 },
    },
  },
  PublishBlogPostRequest: {
    type: "object",
    additionalProperties: false,
    required: ["publish"],
    properties: { publish: { type: "boolean" } },
  },
  CreateBlogCommentRequest: {
    type: "object",
    additionalProperties: false,
    required: ["content"],
    properties: {
      content: { type: "string", minLength: 2, maxLength: 2000 },
      parentId: { $ref: "#/components/schemas/ResourceId" },
    },
  },
  UpdateBlogCommentRequest: {
    type: "object",
    additionalProperties: false,
    minProperties: 1,
    properties: {
      content: { type: "string", minLength: 2, maxLength: 2000 },
      isApproved: { type: "boolean" },
    },
  },
  CreateBlogCategoryRequest: {
    type: "object",
    additionalProperties: false,
    required: ["name"],
    properties: {
      name: { type: "string", minLength: 2, maxLength: 80 },
      slug: {
        type: "string",
        pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
        minLength: 2,
        maxLength: 120,
      },
      description: { type: "string", maxLength: 500 },
      seoTitle: { type: "string", maxLength: 70 },
      seoDescription: { type: "string", maxLength: 160 },
    },
  },
  BlogPostResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["post"],
        properties: { post: { $ref: "#/components/schemas/BlogPost" } },
      },
    },
  },
  BlogPostListResponse: {
    type: "object",
    required: ["message", "data", "meta"],
    properties: {
      message: { type: "string" },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/BlogPost" },
      },
      meta: {
        type: "object",
        required: ["nextCursor", "hasMore"],
        properties: {
          nextCursor: {
            oneOf: [
              { $ref: "#/components/schemas/ResourceId" },
              { type: "null" },
            ],
          },
          hasMore: { type: "boolean" },
        },
      },
    },
  },
  BlogCommentResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["comment"],
        properties: {
          comment: { $ref: "#/components/schemas/BlogComment" },
        },
      },
    },
  },
  BlogCommentListResponse: {
    type: "object",
    required: ["message", "data", "meta"],
    properties: {
      message: { type: "string" },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/BlogComment" },
      },
      meta: {
        type: "object",
        required: ["nextCursor", "hasMore"],
        properties: {
          nextCursor: {
            oneOf: [
              { $ref: "#/components/schemas/ResourceId" },
              { type: "null" },
            ],
          },
          hasMore: { type: "boolean" },
        },
      },
    },
  },
  BlogCategoryResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["category"],
        properties: {
          category: { $ref: "#/components/schemas/BlogCategory" },
        },
      },
    },
  },
  BlogCategoryListResponse: {
    type: "object",
    required: ["message", "data", "meta"],
    properties: {
      message: { type: "string" },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/BlogCategory" },
      },
      meta: {
        type: "object",
        required: ["nextCursor", "hasMore"],
        properties: {
          nextCursor: {
            oneOf: [
              { $ref: "#/components/schemas/ResourceId" },
              { type: "null" },
            ],
          },
          hasMore: { type: "boolean" },
        },
      },
    },
  },
  BlogTagListResponse: {
    type: "object",
    required: ["message", "data", "meta"],
    properties: {
      message: { type: "string" },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/BlogTag" },
      },
      meta: {
        type: "object",
        required: ["nextCursor", "hasMore"],
        properties: {
          nextCursor: {
            oneOf: [
              { $ref: "#/components/schemas/ResourceId" },
              { type: "null" },
            ],
          },
          hasMore: { type: "boolean" },
        },
      },
    },
  },
};
