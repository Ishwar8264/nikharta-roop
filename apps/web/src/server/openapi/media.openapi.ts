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

/** OpenAPI paths exposed by the media module. */
export const mediaPaths = {
  "/api/v1/media": {
    get: {
      tags: ["Media"],
      summary: "List the caller's media",
      description: "Returns a cursor-paginated private media library.",
      operationId: "listMedia",
      security: authenticatedRead,
      parameters: [
        { $ref: "#/components/parameters/CursorParam" },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 30,
          },
        },
        {
          name: "purpose",
          in: "query",
          required: false,
          schema: { $ref: "#/components/schemas/MediaPurpose" },
        },
        {
          name: "unattached",
          in: "query",
          required: false,
          schema: { type: "boolean" },
        },
      ],
      responses: {
        "200": {
          description: "Paginated media library",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MediaListResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "500": errorResponse("Unexpected media listing failure"),
      },
    },
    post: {
      tags: ["Media"],
      summary: "Save an uploaded media asset",
      description:
        "Persists metadata returned by a completed signed Cloudinary upload.",
      operationId: "saveMedia",
      security: authenticatedMutation,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateMediaRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Media asset saved",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MediaResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Media asset does not belong to the caller"),
        "409": errorResponse("Media asset has already been saved"),
        "500": errorResponse("Unexpected media save failure"),
      },
    },
  },
  "/api/v1/media/{id}": {
    delete: {
      tags: ["Media"],
      summary: "Delete a media asset",
      description:
        "Soft-deletes an owned media record and attempts to delete its Cloudinary image.",
      operationId: "deleteMedia",
      security: authenticatedMutation,
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { $ref: "#/components/schemas/ResourceId" },
        },
      ],
      responses: {
        "200": {
          description: "Media asset deleted",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DeleteMediaResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": errorResponse("Media asset does not belong to the caller"),
        "404": errorResponse("Media asset not found"),
        "500": errorResponse("Unexpected media deletion failure"),
      },
    },
  },
} as unknown as OpenAPIV3_1.PathsObject;

/** Reusable OpenAPI schemas exposed by the media module. */
export const mediaSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
  MediaPurpose: {
    type: "string",
    enum: ["GENERAL", "SALON", "PRODUCT", "SERVICE", "BLOG", "AVATAR", "REVIEW"],
  },
  MediaAsset: {
    type: "object",
    required: [
      "id",
      "url",
      "publicId",
      "width",
      "height",
      "format",
      "bytes",
      "purpose",
      "attachedToType",
      "attachedToId",
      "createdAt",
    ],
    properties: {
      id: { $ref: "#/components/schemas/ResourceId" },
      url: { type: "string", format: "uri" },
      publicId: { type: "string", maxLength: 255 },
      width: { type: ["integer", "null"], minimum: 1 },
      height: { type: ["integer", "null"], minimum: 1 },
      format: { type: ["string", "null"], maxLength: 16 },
      bytes: { type: ["integer", "null"], minimum: 0 },
      purpose: { $ref: "#/components/schemas/MediaPurpose" },
      attachedToType: { type: ["string", "null"], maxLength: 32 },
      attachedToId: { type: ["string", "null"], maxLength: 80 },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  CreateMediaRequest: {
    type: "object",
    additionalProperties: false,
    required: ["url", "publicId"],
    properties: {
      url: { type: "string", format: "uri", maxLength: 2048 },
      publicId: { type: "string", minLength: 1, maxLength: 255 },
      width: { type: "integer", minimum: 1 },
      height: { type: "integer", minimum: 1 },
      format: { type: "string", minLength: 1, maxLength: 16 },
      bytes: { type: "integer", minimum: 0 },
      purpose: { $ref: "#/components/schemas/MediaPurpose" },
      attachedToType: { type: "string", maxLength: 32 },
      attachedToId: { type: "string", maxLength: 80 },
    },
  },
  MediaResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["asset"],
        properties: {
          asset: { $ref: "#/components/schemas/MediaAsset" },
        },
      },
    },
  },
  MediaListResponse: {
    type: "object",
    required: ["message", "data", "meta"],
    properties: {
      message: { type: "string" },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/MediaAsset" },
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
  DeleteMediaResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: { type: "null" },
    },
  },
};
