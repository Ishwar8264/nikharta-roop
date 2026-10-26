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

function salonRefParameter(): OpenAPIV3.ParameterObject {
  return {
    name: "salonRef",
    in: "path",
    required: true,
    description: "Salon slug (public) or internal id (management routes).",
    schema: { type: "string" },
  };
}

/** OpenAPI paths for the platform catalog and salon activation. */
export const catalogPaths = {
  "/api/v1/catalog/templates": {
    get: {
      tags: ["Catalog & Activation"],
      summary: "List platform catalog templates",
      description:
        "Ready-made service and package templates. Salons activate these " +
        "with their own price — no setup required. Public endpoint.",
      operationId: "listCatalogTemplates",
      security: [],
      parameters: [
        {
          name: "kind",
          in: "query",
          required: false,
          description: "Filter by template type.",
          schema: { type: "string", enum: ["SERVICE", "PACKAGE"] },
        },
      ],
      responses: {
        "200": {
          description: "Catalog templates",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CatalogTemplateListResponse" },
            },
          },
        },
      },
    },
  },
  "/api/v1/salons/{salonRef}/templates": {
    get: {
      tags: ["Catalog & Activation"],
      summary: "List a salon's activated templates",
      description: "Active templates with the salon's own pricing. Public.",
      operationId: "listSalonTemplates",
      security: [],
      parameters: [salonRefParameter()],
      responses: {
        "200": {
          description: "Activated templates",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SalonTemplateListResponse" },
            },
          },
        },
        "404": errorResponse("Salon not found"),
      },
    },
    post: {
      tags: ["Catalog & Activation"],
      summary: "Activate a template for the salon",
      description:
        "Salon owner/manager activates a catalog template with their own " +
        "price. Re-activating updates the price (idempotent).",
      operationId: "activateSalonTemplate",
      security: authenticatedMutation,
      parameters: [salonRefParameter()],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ActivateTemplateRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Template activated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SalonTemplateResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": errorResponse("Salon or template not found"),
        "409": errorResponse("Template is not available for activation"),
      },
    },
  },
  "/api/v1/salons/{salonRef}/templates/{templateKey}": {
    patch: {
      tags: ["Catalog & Activation"],
      summary: "Update an activation (price or on/off)",
      operationId: "updateSalonTemplate",
      security: authenticatedMutation,
      parameters: [
        salonRefParameter(),
        {
          name: "templateKey",
          in: "path",
          required: true,
          description: 'Stable template key, e.g. "svc.haircut.men".',
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdateSalonTemplateRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Activation updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SalonTemplateResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": errorResponse("Salon, template, or activation not found"),
      },
    },
    delete: {
      tags: ["Catalog & Activation"],
      summary: "Deactivate a template",
      description: "Removes the salon's activation entirely.",
      operationId: "deactivateSalonTemplate",
      security: authenticatedMutation,
      parameters: [
        salonRefParameter(),
        {
          name: "templateKey",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": {
          description: "Template deactivated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuccessResponse" },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": errorResponse("Salon, template, or activation not found"),
      },
    },
  },
} as unknown as OpenAPIV3_1.PathsObject;

/** OpenAPI schemas for the catalog module. */
export const catalogSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
  CatalogTemplate: {
    type: "object",
    required: ["id", "key", "kind", "name", "sortOrder"],
    properties: {
      id: { type: "string" },
      key: {
        type: "string",
        description: "Stable dotted key, e.g. svc.haircut.men",
      },
      kind: { type: "string", enum: ["SERVICE", "PACKAGE"] },
      categoryId: { type: ["string", "null"] },
      name: { type: "string" },
      description: { type: ["string", "null"] },
      icon: { type: ["string", "null"] },
      sortOrder: { type: "integer" },
    },
  },
  SalonTemplate: {
    type: "object",
    required: ["id", "templateId", "price", "isActive", "template"],
    properties: {
      id: { type: "string" },
      templateId: { type: "string" },
      price: { type: "number", description: "Salon's own price in INR" },
      isActive: { type: "boolean" },
      template: { $ref: "#/components/schemas/CatalogTemplate" },
    },
  },
  CatalogTemplateListResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/CatalogTemplate" },
      },
    },
  },
  SalonTemplateListResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/SalonTemplate" },
      },
    },
  },
  SalonTemplateResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["template"],
        properties: {
          template: { $ref: "#/components/schemas/SalonTemplate" },
        },
      },
    },
  },
  ActivateTemplateRequest: {
    type: "object",
    required: ["templateKey", "price"],
    properties: {
      templateKey: { type: "string" },
      price: { type: "number", description: "Salon's price in INR" },
    },
  },
  UpdateSalonTemplateRequest: {
    type: "object",
    description: "At least one field required.",
    properties: {
      price: { type: "number" },
      isActive: { type: "boolean" },
    },
  },
};
