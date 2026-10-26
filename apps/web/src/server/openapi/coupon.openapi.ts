import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

const authenticatedRead: OpenAPIV3.SecurityRequirementObject[] = [
  { bearerAuth: [] },
  { accessCookie: [] },
];

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

/** OpenAPI paths exposed by the coupon module. */
export const couponPaths = {
  "/api/v1/admin/coupons": {
    get: {
      tags: ["Coupons"],
      summary: "List coupons",
      description: "Cursor-paginated list. SUPER_ADMIN only.",
      operationId: "adminListCoupons",
      security: authenticatedRead,
      parameters: [
        { $ref: "#/components/parameters/CursorParam" },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
        },
        {
          name: "search",
          in: "query",
          schema: { type: "string", minLength: 2, maxLength: 32 },
        },
        {
          name: "isActive",
          in: "query",
          schema: { type: "string", enum: ["true", "false"] },
        },
      ],
      responses: {
        "200": {
          description: "Paginated coupon list",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CouponListResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Requires SUPER_ADMIN role"),
      },
    },
    post: {
      tags: ["Coupons"],
      summary: "Create a coupon",
      description:
        "Codes are normalized to uppercase. PERCENTAGE discounts must be " +
        "between 0 and 100; FLAT discounts cannot exceed the optional " +
        "`maxDiscount`. SUPER_ADMIN only.",
      operationId: "adminCreateCoupon",
      security: authenticatedMutation,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateCouponRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Coupon created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CouponResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Requires SUPER_ADMIN role"),
        "409": errorResponse("Coupon code already exists"),
      },
    },
  },
  "/api/v1/admin/coupons/{couponId}": {
    patch: {
      tags: ["Coupons"],
      summary: "Update a coupon",
      description:
        "Partial update. The code is immutable — changing it would break " +
        "bookmarks and marketing material. Cross-field invariants " +
        "(percentage range, max discount vs flat value) are re-checked " +
        "against the merged state.",
      operationId: "adminUpdateCoupon",
      security: authenticatedMutation,
      parameters: [idParameter("couponId")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateCouponRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Coupon updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CouponResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Requires SUPER_ADMIN role"),
        "404": errorResponse("Coupon not found"),
      },
    },
    delete: {
      tags: ["Coupons"],
      summary: "Deactivate a coupon",
      description:
        "Soft-deactivate only — existing appointments still reference the " +
        "row, so deletion would orphan them. New bookings are rejected once " +
        "`isActive` is false.",
      operationId: "adminDeactivateCoupon",
      security: authenticatedMutation,
      parameters: [idParameter("couponId")],
      responses: {
        "200": {
          description: "Coupon deactivated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CouponResponse" },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Requires SUPER_ADMIN role"),
        "404": errorResponse("Coupon not found"),
      },
    },
  },
  "/api/v1/coupons/validate": {
    post: {
      tags: ["Coupons"],
      summary: "Validate a coupon against a subtotal",
      description:
        "Always returns 200. The body's `valid` flag and `reason` field " +
        "carry the outcome. Authentication is optional — the per-user limit " +
        "is enforced when a bearer token or auth cookie is present.",
      operationId: "validateCoupon",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ValidateCouponRequest" },
            examples: {
              tenPercent: {
                summary: "Validate a 10% coupon",
                value: { code: "WELCOME10", subtotal: 1500 },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Validation result",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CouponValidationResponse" },
            },
          },
        },
        "400": validationResponse,
      },
    },
  },
  "/api/v1/coupons/{code}": {
    get: {
      tags: ["Coupons"],
      summary: "Public coupon lookup by code",
      description:
        "Returns the customer-facing snapshot only: description, discount " +
        "configuration, and validity. Capacity counters and admin fields " +
        "are excluded.",
      operationId: "getPublicCoupon",
      security: [],
      parameters: [
        {
          name: "code",
          in: "path",
          required: true,
          schema: { type: "string", minLength: 3, maxLength: 32 },
        },
      ],
      responses: {
        "200": {
          description: "Public coupon snapshot",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PublicCouponResponse" },
            },
          },
        },
        "400": validationResponse,
        "404": errorResponse("Coupon not found"),
      },
    },
  },
  "/api/v1/salons/{salonRef}/coupons": {
    get: {
      tags: ["Coupons"],
      summary: "List a salon's own coupons",
      description:
        "Coupons created by this salon (salon-scoped). MANAGER+.",
      operationId: "listSalonCoupons",
      security: authenticatedRead,
      parameters: [
        {
          name: "salonRef",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        { $ref: "#/components/parameters/CursorParam" },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
        },
        {
          name: "search",
          in: "query",
          schema: { type: "string", minLength: 2, maxLength: 32 },
        },
        {
          name: "isActive",
          in: "query",
          schema: { type: "string", enum: ["true", "false"] },
        },
      ],
      responses: {
        "200": {
          description: "Paginated salon coupon list",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CouponListResponse" },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": errorResponse("Salon not found"),
      },
    },
    post: {
      tags: ["Coupons"],
      summary: "Create a salon-owned coupon",
      description:
        "The coupon is pinned to the salon and only applies to bookings " +
        "at that salon. MANAGER+.",
      operationId: "createSalonCoupon",
      security: authenticatedMutation,
      parameters: [
        {
          name: "salonRef",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateCouponRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Coupon created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CouponResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": errorResponse("Salon not found"),
        "409": errorResponse("Coupon code already exists"),
      },
    },
  },
  "/api/v1/salons/{salonRef}/coupons/{couponId}": {
    patch: {
      tags: ["Coupons"],
      summary: "Update a salon-owned coupon",
      description: "Partial update of the salon's own coupon. MANAGER+.",
      operationId: "updateSalonCoupon",
      security: authenticatedMutation,
      parameters: [
        {
          name: "salonRef",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        idParameter("couponId"),
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateCouponRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Coupon updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CouponResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": errorResponse("Salon or coupon not found"),
      },
    },
    delete: {
      tags: ["Coupons"],
      summary: "Deactivate a salon-owned coupon",
      description:
        "Soft-deactivates so historical bookings keep their reference. MANAGER+.",
      operationId: "deactivateSalonCoupon",
      security: authenticatedMutation,
      parameters: [
        {
          name: "salonRef",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
        idParameter("couponId"),
      ],
      responses: {
        "200": {
          description: "Coupon deactivated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CouponResponse" },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": errorResponse("Salon or coupon not found"),
      },
    },
  },
} as unknown as OpenAPIV3_1.PathsObject;

const couponDiscountTypeSchema: OpenAPIV3_1.SchemaObject = {
  type: "string",
  enum: ["PERCENTAGE", "FLAT"],
};

/** Reusable OpenAPI schemas exposed by the coupon module. */
export const couponSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
  CouponDiscountType: couponDiscountTypeSchema,
  Coupon: {
    type: "object",
    required: [
      "id",
      "code",
      "description",
      "discountType",
      "discountValue",
      "minOrderAmount",
      "maxDiscount",
      "usageLimit",
      "usedCount",
      "perUserLimit",
      "validFrom",
      "validUntil",
      "isActive",
      "createdAt",
    ],
    properties: {
      id: { $ref: "#/components/schemas/ResourceId" },
      code: { type: "string" },
      description: { type: ["string", "null"] },
      discountType: { $ref: "#/components/schemas/CouponDiscountType" },
      discountValue: { type: "number", format: "double" },
      minOrderAmount: { type: ["number", "null"], format: "double" },
      maxDiscount: { type: ["number", "null"], format: "double" },
      usageLimit: { type: ["integer", "null"] },
      usedCount: { type: "integer", minimum: 0 },
      perUserLimit: { type: "integer", minimum: 1 },
      validFrom: { type: "string", format: "date-time" },
      validUntil: { type: "string", format: "date-time" },
      isActive: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  PublicCoupon: {
    type: "object",
    required: [
      "code",
      "description",
      "discountType",
      "discountValue",
      "minOrderAmount",
      "maxDiscount",
      "validUntil",
      "isActive",
    ],
    properties: {
      code: { type: "string" },
      description: { type: ["string", "null"] },
      discountType: { $ref: "#/components/schemas/CouponDiscountType" },
      discountValue: { type: "number", format: "double" },
      minOrderAmount: { type: ["number", "null"], format: "double" },
      maxDiscount: { type: ["number", "null"], format: "double" },
      validUntil: { type: "string", format: "date-time" },
      isActive: { type: "boolean" },
    },
  },
  CreateCouponRequest: {
    type: "object",
    additionalProperties: false,
    required: [
      "code",
      "discountType",
      "discountValue",
      "validFrom",
      "validUntil",
    ],
    properties: {
      code: {
        type: "string",
        minLength: 3,
        maxLength: 32,
        pattern: "^[A-Z0-9-]+$",
      },
      description: { type: "string", maxLength: 500 },
      discountType: { $ref: "#/components/schemas/CouponDiscountType" },
      discountValue: { type: "number", exclusiveMinimum: 0 },
      minOrderAmount: { type: "number", minimum: 0 },
      maxDiscount: { type: "number", exclusiveMinimum: 0 },
      usageLimit: { type: "integer", minimum: 1 },
      perUserLimit: { type: "integer", minimum: 1, default: 1 },
      validFrom: { type: "string", format: "date-time" },
      validUntil: { type: "string", format: "date-time" },
      isActive: { type: "boolean", default: true },
    },
  },
  UpdateCouponRequest: {
    type: "object",
    additionalProperties: false,
    minProperties: 1,
    properties: {
      description: { type: ["string", "null"], maxLength: 500 },
      discountType: { $ref: "#/components/schemas/CouponDiscountType" },
      discountValue: { type: "number", exclusiveMinimum: 0 },
      minOrderAmount: { type: ["number", "null"], minimum: 0 },
      maxDiscount: { type: ["number", "null"], exclusiveMinimum: 0 },
      usageLimit: { type: ["integer", "null"], minimum: 1 },
      perUserLimit: { type: "integer", minimum: 1 },
      validFrom: { type: "string", format: "date-time" },
      validUntil: { type: "string", format: "date-time" },
      isActive: { type: "boolean" },
    },
  },
  ValidateCouponRequest: {
    type: "object",
    additionalProperties: false,
    required: ["code", "subtotal"],
    properties: {
      code: {
        type: "string",
        minLength: 3,
        maxLength: 32,
      },
      subtotal: { type: "number", minimum: 0 },
    },
  },
  CouponValidationResult: {
    type: "object",
    required: ["valid", "code", "discountAmount", "finalTotal"],
    properties: {
      valid: { type: "boolean" },
      code: { type: "string" },
      discountAmount: { type: "number", minimum: 0 },
      finalTotal: { type: "number", minimum: 0 },
      reason: {
        type: "string",
        description: "Human-readable explanation when `valid` is false.",
      },
    },
  },
  CouponResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["coupon"],
        properties: {
          coupon: { $ref: "#/components/schemas/Coupon" },
        },
      },
    },
  },
  CouponListResponse: {
    type: "object",
    required: ["message", "data", "meta"],
    properties: {
      message: { type: "string" },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/Coupon" },
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
  PublicCouponResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["coupon"],
        properties: {
          coupon: { $ref: "#/components/schemas/PublicCoupon" },
        },
      },
    },
  },
  CouponValidationResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: { $ref: "#/components/schemas/CouponValidationResult" },
    },
  },
};
