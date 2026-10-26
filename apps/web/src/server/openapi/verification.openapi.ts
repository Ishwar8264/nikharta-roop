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
                      kind: "Shop license",
                      mediaId:
                        "111111111111111111111111111111111111111111111111",
                    },
                    {
                      kind: "PAN",
                      mediaId:
                        "222222222222222222222222222222222222222222222222",
                    },
                    {
                      kind: "Salon photo 1",
                      mediaId:
                        "333333333333333333333333333333333333333333333333",
                    },
                    {
                      kind: "Salon photo 2",
                      mediaId:
                        "444444444444444444444444444444444444444444444444",
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
              reject: {
                summary: "Reject with reason",
                value: {
                  status: "REJECTED",
                  expectedUpdatedAt: "2026-10-10T10:00:00.000Z",
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
    required: ["kind", "mediaId"],
    properties: {
      kind: {
        type: "string",
        enum: [
          "Shop license",
          "PAN",
          "GST certificate",
          "Salon photo 1",
          "Salon photo 2",
        ],
      },
      mediaId: {
        type: "string",
        pattern: "^[a-fA-F0-9]{48}$",
        description:
          "Private verification upload owned by this salon's current owner",
      },
      url: {
        type: "string",
        readOnly: true,
        description:
          "Authorized application document URL; never supplied on submission",
      },
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
      updatedAt: { type: "string", format: "date-time" },
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
        minItems: 4,
        maxItems: 20,
        description:
          "Requires PAN, Shop license, Salon photo 1 and Salon photo 2, each with a distinct private media ID. GST certificate is optional.",
        items: { $ref: "#/components/schemas/VerificationDocument" },
      },
    },
  },
  ReviewVerificationRequest: {
    type: "object",
    required: ["status", "expectedUpdatedAt"],
    oneOf: [
      {
        required: ["evidence"],
        properties: { status: { enum: ["VERIFIED"] } },
      },
      {
        required: ["reason"],
        properties: { status: { enum: ["REJECTED", "SUSPENDED"] } },
      },
    ],
    properties: {
      status: {
        type: "string",
        enum: ["VERIFIED", "REJECTED", "SUSPENDED"],
      },
      reason: {
        type: "string",
        description: "Required when rejecting or suspending.",
      },
      expectedUpdatedAt: {
        type: "string",
        format: "date-time",
        description:
          "Exact updatedAt value from the submission being reviewed; stale decisions return 409",
      },
      evidence: { $ref: "#/components/schemas/VerificationApprovalEvidence" },
    },
  },
  VerificationApprovalEvidence: {
    type: "object",
    additionalProperties: false,
    required: [
      "identityVerified",
      "businessVerified",
      "authorityVerified",
      "addressMatched",
      "premisesVerified",
      "identitySource",
      "identityReference",
      "businessAuthority",
      "businessReference",
      "notes",
    ],
    properties: {
      identityVerified: { type: "boolean", const: true },
      businessVerified: { type: "boolean", const: true },
      authorityVerified: { type: "boolean", const: true },
      addressMatched: { type: "boolean", const: true },
      premisesVerified: { type: "boolean", const: true },
      identitySource: {
        type: "string",
        enum: [
          "Income Tax",
          "DigiLocker",
          "Authorised PAN verification provider",
        ],
      },
      identityReference: { type: "string", minLength: 6, maxLength: 160 },
      businessAuthority: { type: "string", minLength: 3, maxLength: 160 },
      businessReference: { type: "string", minLength: 6, maxLength: 160 },
      notes: { type: "string", minLength: 40, maxLength: 2000 },
    },
  },
};
