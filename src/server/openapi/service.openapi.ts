import type { OpenAPIV3_1 } from "openapi-types";

/** Service paths: categories and salon services. */
export const servicePaths = {
      "/api/v1/services/categories": {
        get: {
          tags: ["Services"],
          summary: "List global service categories",
          operationId: "listServiceCategories",
          security: [],
          parameters: [
            { $ref: "#/components/parameters/CursorParam" },
            { $ref: "#/components/parameters/LimitParam" },
          ],
          responses: {
            "200": {
              description: "Paginated list of categories",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PaginatedCategoriesResponse",
                  },
                },
              },
            },
            "400": {
              description: "Validation failure",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationErrorResponse",
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Services"],
          summary: "Create a global service category",
          description: "Requires SUPER_ADMIN.",
          operationId: "createServiceCategory",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateCategoryRequest" },
              },
            },
          },
          responses: {
            "201": {
              description: "Category created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CategoryResponse" },
                },
              },
            },
            "401": {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "403": {
              description: "Requires SUPER_ADMIN role",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Category slug already exists",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{salonId}/services": {
        get: {
          tags: ["Services"],
          summary: "List services for a salon",
          operationId: "listSalonServices",
          security: [],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            { $ref: "#/components/parameters/CursorParam" },
            { $ref: "#/components/parameters/LimitParam" },
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "minPrice", in: "query", schema: { type: "number" } },
            { name: "maxPrice", in: "query", schema: { type: "number" } },
            {
              name: "sortBy",
              in: "query",
              schema: {
                type: "string",
                enum: ["createdAt", "price", "duration", "name"],
                default: "createdAt",
              },
            },
            {
              name: "sortOrder",
              in: "query",
              schema: {
                type: "string",
                enum: ["asc", "desc"],
                default: "desc",
              },
            },
          ],
          responses: {
            "200": {
              description: "Paginated list of services",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PaginatedServicesResponse",
                  },
                },
              },
            },
            "404": {
              description: "Salon not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        post: {
          tags: ["Services"],
          summary: "Create a service in a salon",
          description: "Requires at least MANAGER on the target salon.",
          operationId: "createSalonService",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateServiceRequest" },
              },
            },
          },
          responses: {
            "201": {
              description: "Service created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ServiceResponse" },
                },
              },
            },
            "403": {
              description: "Insufficient salon role",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Salon or category not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Service slug already exists in this salon",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{salonId}/services/{serviceId}": {
        get: {
          tags: ["Services"],
          summary: "Get a service by slug",
          operationId: "getSalonService",
          security: [],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "serviceId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Service detail",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ServiceResponse" },
                },
              },
            },
            "404": {
              description: "Salon or service not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        patch: {
          tags: ["Services"],
          summary: "Update a service",
          description: "Requires at least MANAGER on the parent salon.",
          operationId: "updateSalonService",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "serviceId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateServiceRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Service updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ServiceResponse" },
                },
              },
            },
            "403": {
              description: "Insufficient salon role",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Salon, service, or category not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Service slug already exists in this salon",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Services"],
          summary: "Delete a service",
          description: "Soft-deletes a service. Requires at least MANAGER.",
          operationId: "deleteSalonService",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "serviceId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Service deleted",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessResponse" },
                },
              },
            },
            "403": {
              description: "Insufficient salon role",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Salon or service not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
} as unknown as OpenAPIV3_1.PathsObject;

/** Service schemas. */
export const serviceSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
        ServiceCategory: {
          type: "object",
          required: ["id", "name", "slug", "icon"],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            name: { type: "string" },
            slug: { type: "string" },
            icon: { type: ["string", "null"] },
          },
        },
        Service: {
          type: "object",
          required: [
            "id",
            "salonId",
            "categoryId",
            "category",
            "name",
            "slug",
            "price",
            "duration",
            "isActive",
            "shortDescription",
            "description",
            "descriptionHtml",
            "descriptionJson",
            "images",
            "createdAt",
            "updatedAt",
          ],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            salonId: { $ref: "#/components/schemas/ResourceId" },
            categoryId: {
              oneOf: [
                { $ref: "#/components/schemas/ResourceId" },
                { type: "null" },
              ],
            },
            category: {
              oneOf: [
                { $ref: "#/components/schemas/ServiceCategory" },
                { type: "null" },
              ],
            },
            name: { type: "string" },
            slug: { type: "string" },
            price: { type: "number", format: "double" },
            duration: { type: "integer" },
            isActive: { type: "boolean" },
            shortDescription: { type: ["string", "null"] },
            description: { type: ["string", "null"] },
            descriptionHtml: { type: ["string", "null"] },
            descriptionJson: { type: ["string", "null"] },
            images: { type: "array", items: { type: "string", format: "uri" } },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateServiceRequest: {
          type: "object",
          additionalProperties: false,
          required: ["name", "price", "duration"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 120 },
            slug: {
              type: "string",
              pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
              minLength: 2,
              maxLength: 80,
            },
            categoryId: { $ref: "#/components/schemas/ResourceId" },
            price: {
              type: "number",
              minimum: 0,
              maximum: 10000000,
              multipleOf: 0.01,
            },
            duration: { type: "integer", minimum: 5, maximum: 480 },
            isActive: { type: "boolean", default: true },
            shortDescription: { type: "string", maxLength: 280 },
            description: { type: "string", maxLength: 5000 },
            descriptionHtml: { type: "string" },
            descriptionJson: { type: "string" },
            images: {
              type: "array",
              items: { type: "string", format: "uri" },
              maxItems: 10,
              default: [],
            },
          },
        },
        UpdateServiceRequest: {
          type: "object",
          additionalProperties: false,
          minProperties: 1,
          properties: {
            name: { type: "string", minLength: 2, maxLength: 120 },
            slug: {
              type: "string",
              pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
              minLength: 2,
              maxLength: 80,
            },
            categoryId: {
              oneOf: [
                { $ref: "#/components/schemas/ResourceId" },
                { type: "null" },
              ],
            },
            price: {
              type: "number",
              minimum: 0,
              maximum: 10000000,
              multipleOf: 0.01,
            },
            duration: { type: "integer", minimum: 5, maximum: 480 },
            isActive: { type: "boolean" },
            shortDescription: { type: ["string", "null"], maxLength: 280 },
            description: { type: ["string", "null"], maxLength: 5000 },
            descriptionHtml: { type: ["string", "null"] },
            descriptionJson: { type: ["string", "null"] },
            images: {
              type: "array",
              items: { type: "string", format: "uri" },
              maxItems: 10,
            },
          },
        },
        CreateCategoryRequest: {
          type: "object",
          additionalProperties: false,
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 80 },
            slug: {
              type: "string",
              pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
              minLength: 2,
              maxLength: 80,
            },
            icon: { type: "string", maxLength: 64 },
          },
        },
        ServiceResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["service"],
              properties: {
                service: { $ref: "#/components/schemas/Service" },
              },
            },
          },
        },
        CategoryResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["category"],
              properties: {
                category: { $ref: "#/components/schemas/ServiceCategory" },
              },
            },
          },
        },
        PaginatedServicesResponse: {
          type: "object",
          required: ["message", "data", "meta"],
          properties: {
            message: { type: "string" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Service" },
            },
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
        PaginatedCategoriesResponse: {
          type: "object",
          required: ["message", "data", "meta"],
          properties: {
            message: { type: "string" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/ServiceCategory" },
            },
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
};
