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

/** OpenAPI paths for salon packages / combos. */
export const packagePaths = {
  "/api/v1/salons/{salonRef}/packages": {
    get: {
      tags: ["Packages"],
      summary: "List a salon's packages",
      description:
        "Bridal and combo packages. Public endpoint; inactive packages are " +
        "hidden unless includeInactive=true (management view).",
      operationId: "listSalonPackages",
      security: [],
      parameters: [
        salonRefParameter(),
        { $ref: "#/components/parameters/CursorParam" },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        },
        {
          name: "includeInactive",
          in: "query",
          required: false,
          schema: { type: "string", enum: ["true", "false"] },
        },
      ],
      responses: {
        "200": {
          description: "Paginated package list",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PackageListResponse" },
            },
          },
        },
        "404": errorResponse("Salon not found"),
      },
    },
    post: {
      tags: ["Packages"],
      summary: "Create a package",
      description:
        "Creates a combo package for the salon. MANAGER+. Optional " +
        "serviceIds link existing salon services into the package.",
      operationId: "createSalonPackage",
      security: authenticatedMutation,
      parameters: [salonRefParameter()],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreatePackageRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Package created",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PackageResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": errorResponse("Salon not found"),
        "409": errorResponse("Package slug already exists"),
      },
    },
  },
  "/api/v1/salons/{salonRef}/packages/{packageRef}": {
    get: {
      tags: ["Packages"],
      summary: "Get a package by slug",
      description: "Public detail for an active package.",
      operationId: "getSalonPackage",
      security: [],
      parameters: [
        salonRefParameter(),
        {
          name: "packageRef",
          in: "path",
          required: true,
          description: "Package slug (public) or id (management).",
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": {
          description: "Package detail",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PackageResponse" },
            },
          },
        },
        "404": errorResponse("Salon or package not found"),
      },
    },
    patch: {
      tags: ["Packages"],
      summary: "Update a package",
      description:
        "Updates name, price, duration, active flag, or replaces the linked " +
        "services. Uses the internal package id. MANAGER+.",
      operationId: "updateSalonPackage",
      security: authenticatedMutation,
      parameters: [
        salonRefParameter(),
        {
          name: "packageRef",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UpdatePackageRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Package updated",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PackageResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": errorResponse("Salon or package not found"),
      },
    },
    delete: {
      tags: ["Packages"],
      summary: "Delete a package",
      description: "Soft delete. Uses the internal package id. MANAGER+.",
      operationId: "deleteSalonPackage",
      security: authenticatedMutation,
      parameters: [
        salonRefParameter(),
        {
          name: "packageRef",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": {
          description: "Package deleted",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuccessResponse" },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": errorResponse("Salon or package not found"),
      },
    },
  },
} as unknown as OpenAPIV3_1.PathsObject;

/** OpenAPI schemas for the package module. */
export const packageSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
  PackageServiceLine: {
    type: "object",
    required: ["serviceId", "service"],
    properties: {
      serviceId: { type: "string" },
      service: {
        type: "object",
        required: ["id", "name", "slug", "price"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          slug: { type: "string" },
          price: {
            type: "number",
            description: "Standalone service price in INR — lets clients compute package savings.",
          },
        },
      },
    },
  },
  Package: {
    type: "object",
    required: ["id", "salonId", "name", "slug", "price", "duration", "isActive"],
    properties: {
      id: { type: "string" },
      salonId: { type: "string" },
      name: { type: "string" },
      slug: { type: "string" },
      price: { type: "number", description: "Package price in INR" },
      duration: { type: "integer", description: "Total minutes" },
      isActive: { type: "boolean" },
      services: {
        type: "array",
        items: { $ref: "#/components/schemas/PackageServiceLine" },
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  PackageListResponse: {
    type: "object",
    required: ["message", "data", "meta"],
    properties: {
      message: { type: "string" },
      data: { type: "array", items: { $ref: "#/components/schemas/Package" } },
      meta: {
        type: "object",
        required: ["nextCursor", "hasMore"],
        properties: {
          nextCursor: { type: ["string", "null"] },
          hasMore: { type: "boolean" },
        },
      },
    },
  },
  PackageResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["package"],
        properties: {
          package: { $ref: "#/components/schemas/Package" },
        },
      },
    },
  },
  CreatePackageRequest: {
    type: "object",
    required: ["name", "slug", "price", "duration"],
    properties: {
      name: { type: "string" },
      slug: {
        type: "string",
        description: "Lowercase letters, digits, hyphens.",
      },
      price: { type: "number" },
      duration: { type: "integer", minimum: 5, maximum: 1440 },
      isActive: { type: "boolean", default: true },
      serviceIds: {
        type: "array",
        items: { $ref: "#/components/schemas/ResourceId" },
        maxItems: 30,
      },
    },
  },
  UpdatePackageRequest: {
    type: "object",
    description: "At least one field required.",
    properties: {
      name: { type: "string" },
      price: { type: "number" },
      duration: { type: "integer", minimum: 5, maximum: 1440 },
      isActive: { type: "boolean" },
      serviceIds: {
        type: "array",
        items: { $ref: "#/components/schemas/ResourceId" },
        maxItems: 30,
      },
    },
  },
};
