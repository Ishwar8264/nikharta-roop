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

/** OpenAPI paths for salon booking settings. */
export const settingsPaths = {
  "/api/v1/salons/{salonRef}/settings": {
    get: {
      tags: ["Salon Settings"],
      summary: "Get the salon's booking settings",
      description:
        "Buffer time, advance booking window, cancellation window, no-show " +
        "fee, and walk-in/advance-payment flags. Any salon member (STAFF+).",
      operationId: "getSalonSettings",
      security: authenticatedRead,
      parameters: [salonRefParameter()],
      responses: {
        "200": {
          description: "Booking settings",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SettingsResponse" },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": errorResponse("Salon not found"),
      },
    },
    patch: {
      tags: ["Salon Settings"],
      summary: "Update the salon's booking settings",
      description:
        "Partial update — send only the fields to change. MANAGER+.",
      operationId: "updateSalonSettings",
      security: authenticatedMutation,
      parameters: [salonRefParameter()],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateSettingsRequest" },
            examples: {
              buffer: {
                summary: "Set cleanup buffer",
                value: { bufferMinutes: 15 },
              },
              walkIns: {
                summary: "Disable walk-ins",
                value: { walkInsAllowed: false },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Settings updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SettingsResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": errorResponse("Salon not found"),
      },
    },
  },
} as unknown as OpenAPIV3_1.PathsObject;

/** OpenAPI schemas for the salon settings module. */
export const settingsSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
  SalonSettings: {
    type: "object",
    required: [
      "salonId",
      "bufferMinutes",
      "advanceBookingDays",
      "cancellationWindowHours",
      "noShowFee",
      "acceptsAdvancePayments",
      "walkInsAllowed",
    ],
    properties: {
      salonId: { type: "string" },
      bufferMinutes: {
        type: "integer",
        description: "Cleanup gap between appointments.",
      },
      advanceBookingDays: {
        type: "integer",
        description: "How far ahead customers can book.",
      },
      cancellationWindowHours: {
        type: "integer",
        description: "Free cancellation until X hours before.",
      },
      noShowFee: {
        type: ["number", "null"],
        description: "Fee charged when the customer does not show up.",
      },
      acceptsAdvancePayments: {
        type: "boolean",
        description: "Token/advance booking enabled.",
      },
      walkInsAllowed: { type: "boolean" },
    },
  },
  SettingsResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["settings"],
        properties: {
          settings: { $ref: "#/components/schemas/SalonSettings" },
        },
      },
    },
  },
  UpdateSettingsRequest: {
    type: "object",
    description: "At least one field required.",
    properties: {
      bufferMinutes: { type: "integer", minimum: 0, maximum: 120 },
      advanceBookingDays: { type: "integer", minimum: 1, maximum: 365 },
      cancellationWindowHours: { type: "integer", minimum: 0, maximum: 168 },
      noShowFee: { type: ["number", "null"] },
      acceptsAdvancePayments: { type: "boolean" },
      walkInsAllowed: { type: "boolean" },
    },
  },
};
