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

function salonRefParameter(): OpenAPIV3.ParameterObject {
  return {
    name: "salonRef",
    in: "path",
    required: true,
    description: "Salon slug or internal id.",
    schema: { type: "string" },
  };
}

/** OpenAPI paths for salon verification. */
export const verificationPaths = {
  "/api/v1/salons/{salonRef}/verification": {
    get: {
      tags: ["Verification"],
      summary: "Get the salon's verification status",
      description:
        "Returns PENDING, VERIFIED, REJECTED, or SUSPENDED with the latest " +
        "submitted documents. MANAGER+.",
      operationId: "getSalonVerification",
      security: authenticatedRead,
      parameters: [salonRefParameter()],
      responses: {
        "200": {
          description: "Verification status",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerificationResponse" },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": errorResponse("Salon or verification not found"),
      },
    },
  },
  "/api/v1/salons/{salonRef}/verification/submit": {
    post: {
      tags: ["Verification"],
      summary: "Submit verification documents",
      description:
        "OWNER submits KYC documents for review. Resubmission after a " +
        "rejection is allowed; a verified or suspended salon cannot submit.",
      operationId: "submitSalonVerification",
      security: authenticatedMutation,
      parameters: [salonRefParameter()],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SubmitVerificationRequest" },
            examples: {
              shopLicense: {
                summary: "License + photos",
                value: {
                  documents: [
                    {
                      kind: "SHOP_LICENSE",
                      url: "https://res.cloudinary.com/example/license.jpg",
                    },
                    {
                      kind: "SALON_PHOTO",
                      url: "https://res.cloudinary.com/example/salon.jpg",
                    },
                  ],
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Verification submitted",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerificationResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": errorResponse("Salon not found"),
        "409": errorResponse("Already verified or suspended"),
      },
    },
  },
  "/api/v1/admin/salons/{salonRef}/verification/review": {
    post: {
      tags: ["Verification"],
      summary: "Review a salon's verification",
      description:
        "SUPER_ADMIN approves, rejects, or suspends. VERIFIED flips the " +
        "salon live automatically; REJECTED/SUSPENDED hides it. Reason is " +
        "required when not approving.",
      operationId: "reviewSalonVerification",
      security: authenticatedMutation,
      parameters: [salonRefParameter()],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ReviewVerificationRequest" },
            examples: {
              approve: { summary: "Approve", value: { status: "VERIFIED" } },
              reject: {
                summary: "Reject with reason",
                value: {
                  status: "REJECTED",
                  reason: "License photo is blurry, please re-upload.",
                },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Decision applied",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerificationResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": errorResponse("Salon or verification not found"),
        "409": errorResponse("Salon is already verified"),
      },
    },
  },
} as unknown as OpenAPIV3_1.PathsObject;

/** OpenAPI schemas for the verification module. */
export const verificationSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
  VerificationDocument: {
    type: "object",
    required: ["kind", "url"],
    properties: {
      kind: {
        type: "string",
        description: "e.g. SHOP_LICENSE, PAN, SALON_PHOTO, OTHER",
      },
      url: { type: "string", format: "uri" },
    },
  },
  Verification: {
    type: "object",
    required: ["status"],
    properties: {
      status: {
        type: "string",
        enum: ["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"],
      },
      documents: {
        type: ["array", "null"],
        items: { $ref: "#/components/schemas/VerificationDocument" },
      },
      submittedAt: { type: ["string", "null"], format: "date-time" },
      reviewedAt: { type: ["string", "null"], format: "date-time" },
      reason: { type: ["string", "null"] },
    },
  },
  VerificationResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["verification"],
        properties: {
          verification: { $ref: "#/components/schemas/Verification" },
        },
      },
    },
  },
  SubmitVerificationRequest: {
    type: "object",
    required: ["documents"],
    properties: {
      documents: {
        type: "array",
        minItems: 1,
        maxItems: 20,
        items: { $ref: "#/components/schemas/VerificationDocument" },
      },
    },
  },
  ReviewVerificationRequest: {
    type: "object",
    required: ["status"],
    properties: {
      status: {
        type: "string",
        enum: ["VERIFIED", "REJECTED", "SUSPENDED"],
      },
      reason: {
        type: "string",
        description: "Required when rejecting or suspending.",
      },
    },
  },
};
