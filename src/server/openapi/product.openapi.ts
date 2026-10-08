import type { OpenAPIV3_1 } from "openapi-types";

/** Product paths: categories and salon products. */
export const productPaths = {
      "/api/v1/products/categories": {
        get: {
          tags: ["Products"],
          summary: "List global product categories",
          operationId: "listProductCategories",
          security: [],
          parameters: [
            { $ref: "#/components/parameters/CursorParam" },
            { $ref: "#/components/parameters/LimitParam" },
          ],
          responses: {
            "200": {
              description: "Paginated product categories",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PaginatedProductCategoriesResponse",
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
          tags: ["Products"],
          summary: "Create a global product category",
          description: "Requires SUPER_ADMIN.",
          operationId: "createProductCategory",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateProductCategoryRequest",
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Product category created",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ProductCategoryResponse",
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
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
      "/api/v1/salons/{salonId}/products": {
        get: {
          tags: ["Products"],
          summary: "List products for a salon",
          operationId: "listSalonProducts",
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
            { name: "inStock", in: "query", schema: { type: "boolean" } },
            {
              name: "sortBy",
              in: "query",
              schema: {
                type: "string",
                enum: ["createdAt", "price", "name"],
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
              description: "Paginated products",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PaginatedProductsResponse",
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
          tags: ["Products"],
          summary: "Create a product in a salon",
          description: "Requires at least MANAGER on the target salon.",
          operationId: "createSalonProduct",
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
                schema: { $ref: "#/components/schemas/CreateProductRequest" },
              },
            },
          },
          responses: {
            "201": {
              description: "Product created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ProductResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": {
              description: "Salon or product category not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Product slug already exists in this salon",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{salonId}/products/{productId}": {
        get: {
          tags: ["Products"],
          summary: "Get a product",
          operationId: "getSalonProduct",
          security: [],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "productId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Product detail",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ProductResponse" },
                },
              },
            },
            "404": {
              description: "Salon or product not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        patch: {
          tags: ["Products"],
          summary: "Update a product",
          description: "Requires at least MANAGER on the parent salon.",
          operationId: "updateSalonProduct",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "productId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateProductRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Product updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ProductResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": {
              description: "Salon, product, or category not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Product slug already exists in this salon",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Products"],
          summary: "Delete a product",
          description: "Soft-deletes a product. Requires at least MANAGER.",
          operationId: "deleteSalonProduct",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "productId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          responses: {
            "200": {
              description: "Product deleted",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": {
              description: "Salon or product not found",
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

/** Product schemas. */
export const productSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
        ProductCategory: {
          type: "object",
          required: ["id", "name", "slug"],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            name: { type: "string" },
            slug: { type: "string" },
          },
        },
        Product: {
          type: "object",
          required: [
            "id",
            "salonId",
            "categoryId",
            "category",
            "name",
            "slug",
            "price",
            "stock",
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
                { $ref: "#/components/schemas/ProductCategory" },
                { type: "null" },
              ],
            },
            name: { type: "string" },
            slug: { type: "string" },
            price: { type: "number", format: "double" },
            stock: { type: "integer" },
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
        CreateProductRequest: {
          type: "object",
          additionalProperties: false,
          required: ["name", "price"],
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
            stock: {
              type: "integer",
              minimum: 0,
              maximum: 1000000,
              default: 0,
            },
            isActive: { type: "boolean", default: true },
            shortDescription: { type: "string", maxLength: 280 },
            description: { type: "string", maxLength: 5000 },
            descriptionHtml: { type: "string", maxLength: 20000 },
            descriptionJson: { type: "string", maxLength: 50000 },
            images: {
              type: "array",
              items: { type: "string", format: "uri" },
              maxItems: 10,
              default: [],
            },
          },
        },
        UpdateProductRequest: {
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
            stock: { type: "integer", minimum: 0, maximum: 1000000 },
            isActive: { type: "boolean" },
            shortDescription: { type: ["string", "null"], maxLength: 280 },
            description: { type: ["string", "null"], maxLength: 5000 },
            descriptionHtml: { type: ["string", "null"], maxLength: 20000 },
            descriptionJson: { type: ["string", "null"], maxLength: 50000 },
            images: {
              type: "array",
              items: { type: "string", format: "uri" },
              maxItems: 10,
            },
          },
        },
        CreateProductCategoryRequest: {
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
          },
        },
        ProductResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["product"],
              properties: {
                product: { $ref: "#/components/schemas/Product" },
              },
            },
          },
        },
        ProductCategoryResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["category"],
              properties: {
                category: { $ref: "#/components/schemas/ProductCategory" },
              },
            },
          },
        },
        PaginatedProductsResponse: {
          type: "object",
          required: ["message", "data", "meta"],
          properties: {
            message: { type: "string" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Product" },
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
        PaginatedProductCategoriesResponse: {
          type: "object",
          required: ["message", "data", "meta"],
          properties: {
            message: { type: "string" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/ProductCategory" },
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
