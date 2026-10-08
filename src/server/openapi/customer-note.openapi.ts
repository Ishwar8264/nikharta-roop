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

/** OpenAPI paths for customer notes (staff POV). */
export const customerNotePaths = {
  "/api/v1/salons/{salonRef}/customers/{customerId}/notes": {
    get: {
      tags: ["Customer Notes"],
      summary: "List a customer's notes",
      description:
        "Internal staff notes about a customer — preferences, allergies, " +
        "color history. STAFF+ only.",
      operationId: "listCustomerNotes",
      security: authenticatedRead,
      parameters: [
        salonRefParameter(),
        {
          name: "customerId",
          in: "path",
          required: true,
          schema: { $ref: "#/components/schemas/ResourceId" },
        },
      ],
      responses: {
        "200": {
          description: "Customer notes",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CustomerNoteListResponse" },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": errorResponse("Salon not found"),
      },
    },
    post: {
      tags: ["Customer Notes"],
      summary: "Add a note about a customer",
      description: "Creates an internal note. STAFF+.",
      operationId: "createCustomerNote",
      security: authenticatedMutation,
      parameters: [
        salonRefParameter(),
        {
          name: "customerId",
          in: "path",
          required: true,
          schema: { $ref: "#/components/schemas/ResourceId" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateCustomerNoteRequest" },
            examples: {
              allergy: {
                summary: "Allergy note",
                value: {
                  note: "Allergic to ammonia-based hair color — use herbal only.",
                },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Note created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CustomerNoteResponse" },
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
  "/api/v1/salons/{salonRef}/customers/{customerId}/notes/{noteId}": {
    delete: {
      tags: ["Customer Notes"],
      summary: "Delete a note",
      description: "The note's author or a MANAGER+ can delete.",
      operationId: "deleteCustomerNote",
      security: authenticatedMutation,
      parameters: [
        salonRefParameter(),
        {
          name: "customerId",
          in: "path",
          required: true,
          schema: { $ref: "#/components/schemas/ResourceId" },
        },
        {
          name: "noteId",
          in: "path",
          required: true,
          schema: { $ref: "#/components/schemas/ResourceId" },
        },
      ],
      responses: {
        "200": {
          description: "Note deleted",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuccessResponse" },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": errorResponse("Salon or note not found"),
      },
    },
  },
} as unknown as OpenAPIV3_1.PathsObject;

/** OpenAPI schemas for the customer note module. */
export const customerNoteSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
  CustomerNote: {
    type: "object",
    required: ["id", "customerId", "salonId", "note", "createdBy", "author", "createdAt"],
    properties: {
      id: { type: "string" },
      customerId: { type: "string" },
      salonId: { type: "string" },
      note: { type: "string" },
      createdBy: { type: "string", description: "Staff user id" },
      author: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" },
          name: { type: ["string", "null"] },
        },
      },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  CustomerNoteListResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/CustomerNote" },
      },
    },
  },
  CustomerNoteResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["note"],
        properties: {
          note: { $ref: "#/components/schemas/CustomerNote" },
        },
      },
    },
  },
  CreateCustomerNoteRequest: {
    type: "object",
    required: ["note"],
    properties: {
      note: { type: "string", minLength: 1, maxLength: 2000 },
    },
  },
};
