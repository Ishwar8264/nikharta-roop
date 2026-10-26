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

const listParameters: Array<
  OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject
> = [
  { $ref: "#/components/parameters/CursorParam" },
  { $ref: "#/components/parameters/LimitParam" },
  {
    name: "sort",
    in: "query",
    required: false,
    schema: {
      type: "string",
      enum: ["recent", "rating_desc", "rating_asc"],
      default: "recent",
    },
  },
];

/** OpenAPI paths exposed by the reviews and staff-ratings module. */
export const reviewPaths = {
  "/api/v1/services/{serviceId}/reviews": {
    get: {
      tags: ["Reviews & Ratings"],
      summary: "List service reviews",
      operationId: "listServiceReviews",
      security: [],
      parameters: [idParameter("serviceId"), ...listParameters],
      responses: {
        "200": {
          description: "Reviews and aggregate rating summary",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReviewListResponse" },
            },
          },
        },
        "400": validationResponse,
        "404": errorResponse("Active service not found"),
      },
    },
    post: {
      tags: ["Reviews & Ratings"],
      summary: "Create or replace a service review",
      description:
        "Upserts the caller's review. A caller can have one review per service.",
      operationId: "upsertServiceReview",
      security: authenticatedMutation,
      parameters: [idParameter("serviceId")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpsertReviewRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Review saved",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReviewResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": errorResponse("Active service not found"),
      },
    },
  },
  "/api/v1/services/{serviceId}/reviews/{reviewId}": {
    patch: {
      tags: ["Reviews & Ratings"],
      summary: "Update a service review",
      description: "Only the review author may update it.",
      operationId: "updateServiceReview",
      security: authenticatedMutation,
      parameters: [idParameter("serviceId"), idParameter("reviewId")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateReviewRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Review updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReviewResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Caller does not own the review"),
        "404": errorResponse("Review not found for this service"),
      },
    },
    delete: {
      tags: ["Reviews & Ratings"],
      summary: "Delete a service review",
      description: "Only the review author may delete it.",
      operationId: "deleteServiceReview",
      security: authenticatedMutation,
      parameters: [idParameter("serviceId"), idParameter("reviewId")],
      responses: {
        "200": {
          description: "Review deleted",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DeleteReviewResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Caller does not own the review"),
        "404": errorResponse("Review not found for this service"),
      },
    },
  },
  "/api/v1/products/{productId}/reviews": {
    get: {
      tags: ["Reviews & Ratings"],
      summary: "List product reviews",
      operationId: "listProductReviews",
      security: [],
      parameters: [idParameter("productId"), ...listParameters],
      responses: {
        "200": {
          description: "Reviews and aggregate rating summary",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReviewListResponse" },
            },
          },
        },
        "400": validationResponse,
        "404": errorResponse("Active product not found"),
      },
    },
    post: {
      tags: ["Reviews & Ratings"],
      summary: "Create or replace a product review",
      description:
        "Upserts the caller's review. A caller can have one review per product.",
      operationId: "upsertProductReview",
      security: authenticatedMutation,
      parameters: [idParameter("productId")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpsertReviewRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Review saved",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReviewResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": errorResponse("Active product not found"),
      },
    },
  },
  "/api/v1/products/{productId}/reviews/{reviewId}": {
    patch: {
      tags: ["Reviews & Ratings"],
      summary: "Update a product review",
      description: "Only the review author may update it.",
      operationId: "updateProductReview",
      security: authenticatedMutation,
      parameters: [idParameter("productId"), idParameter("reviewId")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateReviewRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Review updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReviewResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Caller does not own the review"),
        "404": errorResponse("Review not found for this product"),
      },
    },
    delete: {
      tags: ["Reviews & Ratings"],
      summary: "Delete a product review",
      description: "Only the review author may delete it.",
      operationId: "deleteProductReview",
      security: authenticatedMutation,
      parameters: [idParameter("productId"), idParameter("reviewId")],
      responses: {
        "200": {
          description: "Review deleted",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DeleteReviewResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Caller does not own the review"),
        "404": errorResponse("Review not found for this product"),
      },
    },
  },
  "/api/v1/staff/{staffUserId}/ratings": {
    get: {
      tags: ["Reviews & Ratings"],
      summary: "List staff ratings",
      operationId: "listStaffRatings",
      security: [],
      parameters: [idParameter("staffUserId"), ...listParameters],
      responses: {
        "200": {
          description: "Ratings and aggregate rating summary",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StaffRatingListResponse" },
            },
          },
        },
        "400": validationResponse,
        "404": errorResponse("Active salon staff member not found"),
      },
    },
  },
  "/api/v1/appointments/{appointmentId}/staff-ratings": {
    get: {
      tags: ["Reviews & Ratings"],
      summary: "List staff ratings for an appointment",
      description:
        "Returns the caller's staff ratings for one appointment. Only the " +
        "appointment customer may read their own ratings.",
      operationId: "listStaffRatingsForAppointment",
      security: authenticatedMutation,
      parameters: [idParameter("appointmentId")],
      responses: {
        "200": {
          description: "Ratings for the appointment",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AppointmentStaffRatingListResponse",
              },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Caller is not the appointment customer"),
        "404": errorResponse("Appointment not found"),
      },
    },
    post: {
      tags: ["Reviews & Ratings"],
      summary: "Rate staff for a completed appointment",
      description:
        "Only the appointment customer may rate its primary staff member. " +
        "The appointment must be COMPLETED and may be rated once.",
      operationId: "createStaffRating",
      security: authenticatedMutation,
      parameters: [idParameter("appointmentId")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateStaffRatingRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Staff rating created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StaffRatingResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Caller is not the appointment customer"),
        "404": errorResponse("Appointment not found"),
        "409": errorResponse(
          "Appointment is incomplete, has no staff, or was already rated",
        ),
      },
    },
  },
  "/api/v1/staff-ratings/{ratingId}": {
    patch: {
      tags: ["Reviews & Ratings"],
      summary: "Update a staff rating",
      description: "Only the customer who created the rating may update it.",
      operationId: "updateStaffRating",
      security: authenticatedMutation,
      parameters: [idParameter("ratingId")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateStaffRatingRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Rating updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StaffRatingResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Caller does not own the rating"),
        "404": errorResponse("Rating not found"),
      },
    },
    delete: {
      tags: ["Reviews & Ratings"],
      summary: "Delete a staff rating",
      description: "Only the customer who created the rating may delete it.",
      operationId: "deleteStaffRating",
      security: authenticatedMutation,
      parameters: [idParameter("ratingId")],
      responses: {
        "200": {
          description: "Rating deleted",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DeleteReviewResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Caller does not own the rating"),
        "404": errorResponse("Rating not found"),
      },
    },
  },
} as unknown as OpenAPIV3_1.PathsObject;

const personSchema: OpenAPIV3_1.SchemaObject = {
  type: "object",
  required: ["id", "name", "avatar"],
  properties: {
    id: { $ref: "#/components/schemas/ResourceId" },
    name: { type: ["string", "null"] },
    avatar: { type: ["string", "null"], format: "uri" },
  },
};

const ratingProperty: OpenAPIV3_1.SchemaObject = {
  type: "integer",
  minimum: 1,
  maximum: 5,
};

const commentProperty: OpenAPIV3_1.SchemaObject = {
  type: ["string", "null"],
  maxLength: 2000,
};

/** Reusable OpenAPI schemas exposed by the reviews module. */
export const reviewSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
  Review: {
    type: "object",
    required: ["id", "rating", "comment", "images", "createdAt", "author"],
    properties: {
      id: { $ref: "#/components/schemas/ResourceId" },
      rating: ratingProperty,
      comment: commentProperty,
      images: {
        type: "array",
        maxItems: 5,
        items: { type: "string", format: "uri" },
      },
      createdAt: { type: "string", format: "date-time" },
      author: personSchema,
    },
  },
  StaffRating: {
    type: "object",
    required: [
      "id",
      "staffId",
      "rating",
      "comment",
      "createdAt",
      "appointmentId",
      "customer",
    ],
    properties: {
      id: { $ref: "#/components/schemas/ResourceId" },
      staffId: { $ref: "#/components/schemas/ResourceId" },
      rating: ratingProperty,
      comment: commentProperty,
      createdAt: { type: "string", format: "date-time" },
      appointmentId: {
        oneOf: [
          { $ref: "#/components/schemas/ResourceId" },
          { type: "null" },
        ],
      },
      customer: personSchema,
    },
  },
  RatingSummary: {
    type: "object",
    required: ["average", "count"],
    properties: {
      average: { type: "number", minimum: 0, maximum: 5 },
      count: { type: "integer", minimum: 0 },
    },
  },
  UpsertReviewRequest: {
    type: "object",
    additionalProperties: false,
    required: ["rating"],
    properties: {
      rating: ratingProperty,
      comment: commentProperty,
      images: {
        type: "array",
        maxItems: 5,
        default: [],
        items: { type: "string", format: "uri", maxLength: 2048 },
      },
    },
  },
  UpdateReviewRequest: {
    type: "object",
    additionalProperties: false,
    minProperties: 1,
    properties: {
      rating: ratingProperty,
      comment: commentProperty,
      images: {
        type: "array",
        maxItems: 5,
        items: { type: "string", format: "uri", maxLength: 2048 },
      },
    },
  },
  CreateStaffRatingRequest: {
    type: "object",
    additionalProperties: false,
    required: ["rating"],
    properties: {
      rating: ratingProperty,
      comment: commentProperty,
    },
  },
  UpdateStaffRatingRequest: {
    type: "object",
    additionalProperties: false,
    minProperties: 1,
    properties: {
      rating: ratingProperty,
      comment: commentProperty,
    },
  },
  ReviewResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["review"],
        properties: {
          review: { $ref: "#/components/schemas/Review" },
        },
      },
    },
  },
  StaffRatingResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["rating"],
        properties: {
          rating: { $ref: "#/components/schemas/StaffRating" },
        },
      },
    },
  },
  ReviewListResponse: {
    type: "object",
    required: ["message", "data", "meta"],
    properties: {
      message: { type: "string" },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/Review" },
      },
      meta: { $ref: "#/components/schemas/ReviewPaginationMeta" },
    },
  },
  StaffRatingListResponse: {
    type: "object",
    required: ["message", "data", "meta"],
    properties: {
      message: { type: "string" },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/StaffRating" },
      },
      meta: { $ref: "#/components/schemas/ReviewPaginationMeta" },
    },
  },
  /**
   * Appointment-scoped staff rating list.
   *
   * Why a separate schema from `StaffRatingListResponse`:
   * The appointment view is bounded by the unique constraint on
   * `(appointmentId, staffId)` — at most one row per staff member — so there
   * is no cursor/`hasMore` and no cross-staff aggregate `summary` to return.
   */
  AppointmentStaffRatingListResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/StaffRating" },
      },
    },
  },
  ReviewPaginationMeta: {
    type: "object",
    required: ["summary", "nextCursor", "hasMore"],
    properties: {
      summary: { $ref: "#/components/schemas/RatingSummary" },
      nextCursor: {
        oneOf: [
          { $ref: "#/components/schemas/ResourceId" },
          { type: "null" },
        ],
      },
      hasMore: { type: "boolean" },
    },
  },
  DeleteReviewResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: { type: "null" },
    },
  },
};
