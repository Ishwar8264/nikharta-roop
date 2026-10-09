import type { OpenAPIV3_1 } from "openapi-types";

/** Salon paths: directory, members, and weekly working hours. */
export const salonPaths = {
      "/api/v1/salons": {
        get: {
          tags: ["Salons"],
          summary: "List salons",
          description:
            "Cursor-paginated list of active salons. Supports `city`, `category`, " +
            "and `search` filters. Cursor pagination is stable under inserts, so " +
            "infinite scroll will not skip entries when new salons appear.",
          operationId: "listSalons",
          security: [],
          parameters: [
            { $ref: "#/components/parameters/CursorParam" },
            { $ref: "#/components/parameters/LimitParam" },
            {
              name: "city",
              in: "query",
              schema: { type: "string", maxLength: 80 },
              example: "Mumbai",
            },
            {
              name: "category",
              in: "query",
              schema: {
                type: "string",
                enum: ["MALE", "FEMALE", "UNISEX", "KIDS"],
              },
            },
            {
              name: "search",
              in: "query",
              schema: { type: "string", minLength: 2, maxLength: 80 },
              description: "Case-insensitive match on name or description.",
            },
          ],
          responses: {
            "200": {
              description: "Paginated list of salons",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PaginatedSalonsResponse",
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
            "500": {
              description: "Unexpected listing failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        post: {
          tags: ["Salons"],
          summary: "Create a salon",
          description:
            "Any authenticated user can open a salon and becomes its first OWNER. " +
            "If `slug` is omitted it is derived from `name` with numeric suffixes " +
            "on collision.",
          operationId: "createSalon",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateSalonRequest" },
              },
            },
          },
          responses: {
            "201": {
              description: "Salon created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SalonResponse" },
                },
              },
            },
            "400": {
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
            },
            "401": {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Slug already in use",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected creation failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{salonId}": {
        get: {
          tags: ["Salons"],
          summary: "Get a salon by slug",
          description: "Public detail lookup by the salon's URL slug.",
          operationId: "getSalonBySlug",
          security: [],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string", minLength: 2, maxLength: 80 },
            },
          ],
          responses: {
            "200": {
              description: "Salon detail",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SalonDetailResponse" },
                },
              },
            },
            "400": {
              description: "Invalid slug",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationErrorResponse",
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
            "500": {
              description: "Unexpected lookup failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        patch: {
          tags: ["Salons"],
          summary: "Update a salon",
          description:
            "Partial update. Requires at least MANAGER on the target salon. Empty " +
            "bodies are rejected with 400.",
          operationId: "updateSalon",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateSalonRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Salon updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SalonResponse" },
                },
              },
            },
            "400": {
              description: "Malformed JSON, validation failure, or empty body",
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
              description: "Insufficient salon role",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Salon not found or caller is not a member",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Slug already in use",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected update failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Salons"],
          summary: "Delete a salon",
          description:
            "Soft-deletes a salon. Requires OWNER on the target salon. The row " +
            "remains in the database with `deletedAt` set so downstream data keeps " +
            "its references.",
          operationId: "deleteSalon",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          responses: {
            "200": {
              description: "Salon deleted",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessResponse" },
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
              description: "Insufficient salon role",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Salon not found or caller is not a member",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected deletion failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{id}/members": {
        get: {
          tags: ["Salons"],
          summary: "List salon members",
          description: "Requires at least MANAGER on the target salon.",
          operationId: "listSalonMembers",
          security: [{ bearerAuth: [] }],
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
              description: "Member roster",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/SalonMemberListResponse",
                  },
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
              description: "Insufficient salon role",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Salon not found or caller is not a member",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected listing failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        post: {
          tags: ["Salons"],
          summary: "Add a salon member",
          description: "Requires OWNER on the target salon.",
          operationId: "addSalonMember",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AddSalonMemberRequest" },
              },
            },
          },
          responses: {
            "201": {
              description: "Member added",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SalonMemberResponse" },
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
            "401": {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
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
              description: "Salon not found or caller is not a member",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "User is already a member",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected add failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{id}/members/{memberId}": {
        delete: {
          tags: ["Salons"],
          summary: "Remove a salon member",
          description:
            "Requires OWNER on the target salon. The last OWNER cannot be removed " +
            "— the request returns 409 to prevent orphaning the salon.",
          operationId: "removeSalonMember",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
            {
              name: "memberId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          responses: {
            "200": {
              description: "Member removed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessResponse" },
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
              description: "Insufficient salon role",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Salon or member not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Cannot remove the last owner",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected removal failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{salonRef}/working-hours": {
        get: {
          tags: ["Salon Working Hours"],
          summary: "Get a salon's weekly opening hours",
          operationId: "getSalonWorkingHours",
          security: [],
          parameters: [
            {
              name: "salonRef",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Weekly hours",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/WorkingHoursResponse",
                  },
                },
              },
            },
            "400": {
              description: "Invalid salon reference",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationErrorResponse",
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
        put: {
          tags: ["Salon Working Hours"],
          summary: "Replace a salon's weekly opening hours",
          description:
            "Requires at least MANAGER on the target salon. Sends the full week " +
            "as one request; each day may appear at most once.",
          operationId: "replaceSalonWorkingHours",
          security: [{ bearerAuth: [] }],
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
                schema: {
                  $ref: "#/components/schemas/ReplaceWorkingHoursRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Working hours replaced",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/WorkingHoursResponse",
                  },
                },
              },
            },
            "400": {
              description: "Invalid salon reference, JSON, or request body",
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
              description: "Insufficient salon role",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Salon not found or caller is not a member",
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

/** Salon schemas: salon rows, members, working hours. */
export const salonSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
        Salon: {
          type: "object",
          required: [
            "id",
            "name",
            "slug",
            "shortDescription",
            "description",
            "descriptionHtml",
            "descriptionJson",
            "category",
            "address",
            "city",
            "state",
            "zip",
            "country",
            "timezone",
            "lat",
            "lng",
            "placeId",
            "phone",
            "email",
            "images",
            "createdAt",
            "updatedAt",
          ],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            name: { type: "string" },
            slug: { type: "string" },
            shortDescription: { type: ["string", "null"] },
            description: { type: ["string", "null"] },
            descriptionHtml: { type: ["string", "null"] },
            descriptionJson: { type: ["string", "null"] },
            category: {
              type: "string",
              enum: ["MALE", "FEMALE", "UNISEX", "KIDS"],
            },
            address: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            zip: { type: "string" },
            country: { type: "string" },
            timezone: { type: "string" },
            lat: { type: "number", format: "float" },
            lng: { type: "number", format: "float" },
            placeId: { type: ["string", "null"] },
            phone: { type: ["string", "null"] },
            email: { type: ["string", "null"], format: "email" },
            coverImage: { type: ["string", "null"], format: "uri", maxLength: 2048 },
            bannerImage: { type: ["string", "null"], format: "uri", maxLength: 2048 },
            images: {
              type: "array",
              items: { type: "string", format: "uri" },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateSalonRequest: {
          type: "object",
          additionalProperties: false,
          required: ["name", "address", "city", "state", "zip", "lat", "lng"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 120 },
            slug: {
              type: "string",
              pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
              minLength: 2,
              maxLength: 80,
            },
            shortDescription: { type: "string", maxLength: 280 },
            description: { type: "string", maxLength: 5000 },
            descriptionHtml: { type: "string", maxLength: 20000 },
            descriptionJson: { type: "string", maxLength: 50000 },
            category: {
              type: "string",
              enum: ["MALE", "FEMALE", "UNISEX", "KIDS"],
              default: "UNISEX",
            },
            address: { type: "string", minLength: 5, maxLength: 500 },
            city: { type: "string", maxLength: 80 },
            state: { type: "string", maxLength: 80 },
            zip: { type: "string", minLength: 3, maxLength: 12 },
            country: {
              type: "string",
              minLength: 2,
              maxLength: 2,
              default: "IN",
            },
            timezone: { type: "string", default: "Asia/Kolkata" },
            lat: { type: "number", minimum: -90, maximum: 90 },
            lng: { type: "number", minimum: -180, maximum: 180 },
            placeId: { type: "string", maxLength: 255 },
            phone: { type: "string", pattern: "^\\+[1-9]\\d{7,14}$" },
            email: { type: "string", format: "email", maxLength: 254 },
            coverImage: { type: "string", format: "uri", maxLength: 2048 },
            bannerImage: { type: "string", format: "uri", maxLength: 2048 },
            images: {
              type: "array",
              items: { type: "string", format: "uri" },
              maxItems: 20,
              default: [],
            },
          },
        },
        UpdateSalonRequest: {
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
            shortDescription: {
              type: ["string", "null"],
              maxLength: 280,
            },
            description: { type: ["string", "null"], maxLength: 5000 },
            descriptionHtml: {
              type: ["string", "null"],
              maxLength: 20000,
            },
            descriptionJson: {
              type: ["string", "null"],
              maxLength: 50000,
            },
            category: {
              type: "string",
              enum: ["MALE", "FEMALE", "UNISEX", "KIDS"],
            },
            address: { type: "string", minLength: 5, maxLength: 500 },
            city: { type: "string", maxLength: 80 },
            state: { type: "string", maxLength: 80 },
            zip: { type: "string", minLength: 3, maxLength: 12 },
            country: { type: "string", minLength: 2, maxLength: 2 },
            timezone: { type: "string" },
            lat: { type: "number", minimum: -90, maximum: 90 },
            lng: { type: "number", minimum: -180, maximum: 180 },
            placeId: { type: "string", maxLength: 255 },
            phone: { type: "string", pattern: "^\\+[1-9]\\d{7,14}$" },
            email: { type: "string", format: "email", maxLength: 254 },
            coverImage: { type: ["string", "null"], format: "uri", maxLength: 2048 },
            bannerImage: { type: ["string", "null"], format: "uri", maxLength: 2048 },
            images: {
              type: "array",
              items: { type: "string", format: "uri" },
              maxItems: 20,
            },
          },
        },
        SalonResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["salon"],
              properties: {
                salon: { $ref: "#/components/schemas/Salon" },
              },
            },
          },
        },
        SalonWorkingHour: {
          type: "object",
          required: ["day", "openTime", "closeTime", "isClosed"],
          properties: {
            day: {
              type: "string",
              enum: [
                "MONDAY",
                "TUESDAY",
                "WEDNESDAY",
                "THURSDAY",
                "FRIDAY",
                "SATURDAY",
                "SUNDAY",
              ],
            },
            openTime: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
            closeTime: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
            isClosed: { type: "boolean" },
          },
        },
        SalonServicePreview: {
          type: "object",
          required: [
            "id",
            "name",
            "slug",
            "price",
            "duration",
            "images",
            "category",
          ],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            name: { type: "string" },
            slug: { type: "string" },
            price: { type: "number", minimum: 0 },
            duration: { type: "integer", minimum: 5 },
            images: {
              type: "array",
              items: { type: "string", format: "uri" },
            },
            category: {
              oneOf: [
                { type: "null" },
                {
                  type: "object",
                  required: ["name", "slug"],
                  properties: {
                    name: { type: "string" },
                    slug: { type: "string" },
                  },
                },
              ],
            },
          },
        },
        SalonDetail: {
          allOf: [
            { $ref: "#/components/schemas/Salon" },
            {
              type: "object",
              required: ["workingHours", "services", "_count"],
              properties: {
                workingHours: {
                  type: "array",
                  items: { $ref: "#/components/schemas/SalonWorkingHour" },
                },
                services: {
                  type: "array",
                  maxItems: 6,
                  items: { $ref: "#/components/schemas/SalonServicePreview" },
                },
                _count: {
                  type: "object",
                  required: ["services", "products"],
                  properties: {
                    services: { type: "integer", minimum: 0 },
                    products: { type: "integer", minimum: 0 },
                  },
                },
              },
            },
          ],
        },
        SalonDetailResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string", const: "Salon retrieved" },
            data: {
              type: "object",
              required: ["salon"],
              properties: {
                salon: { $ref: "#/components/schemas/SalonDetail" },
              },
            },
          },
        },
        PaginatedSalonsResponse: {
          type: "object",
          required: ["message", "data", "meta"],
          properties: {
            message: { type: "string", const: "Salons retrieved" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Salon" },
            },
            meta: {
              type: "object",
              required: ["nextCursor", "hasMore"],
              properties: {
                nextCursor: {
                  type: ["string", "null"],
                  format: "uuid",
                  description:
                    "Pass as the `cursor` query param to fetch the next page. Null when there are no more results.",
                },
                hasMore: { type: "boolean" },
              },
            },
          },
        },
        SalonMember: {
          type: "object",
          required: ["id", "userId", "salonId", "role", "user"],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            userId: { $ref: "#/components/schemas/ResourceId" },
            salonId: { $ref: "#/components/schemas/ResourceId" },
            role: { type: "string", enum: ["OWNER", "MANAGER", "STAFF"] },
            user: {
              type: "object",
              required: ["id", "name", "email"],
              properties: {
                id: { $ref: "#/components/schemas/ResourceId" },
                name: { type: ["string", "null"] },
                email: { type: ["string", "null"], format: "email" },
              },
            },
          },
        },
        AddSalonMemberRequest: {
          type: "object",
          additionalProperties: false,
          required: ["userId", "role"],
          properties: {
            userId: { $ref: "#/components/schemas/ResourceId" },
            role: { type: "string", enum: ["OWNER", "MANAGER", "STAFF"] },
          },
        },
        SalonMemberResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["member"],
              properties: {
                member: { $ref: "#/components/schemas/SalonMember" },
              },
            },
          },
        },
        SalonMemberListResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/SalonMember" },
            },
          },
        },
        WorkingHoursDay: {
          type: "object",
          required: ["id", "day", "openTime", "closeTime", "isClosed"],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            day: {
              type: "string",
              enum: [
                "MONDAY",
                "TUESDAY",
                "WEDNESDAY",
                "THURSDAY",
                "FRIDAY",
                "SATURDAY",
                "SUNDAY",
              ],
            },
            openTime: {
              type: "string",
              pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
            },
            closeTime: {
              type: "string",
              pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
            },
            isClosed: { type: "boolean" },
          },
        },
        ReplaceWorkingHoursRequest: {
          type: "object",
          additionalProperties: false,
          required: ["days"],
          properties: {
            days: {
              type: "array",
              minItems: 7,
              maxItems: 7,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["day"],
                properties: {
                  day: {
                    type: "string",
                    enum: [
                      "MONDAY",
                      "TUESDAY",
                      "WEDNESDAY",
                      "THURSDAY",
                      "FRIDAY",
                      "SATURDAY",
                      "SUNDAY",
                    ],
                  },
                  openTime: {
                    type: "string",
                    pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
                  },
                  closeTime: {
                    type: "string",
                    pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
                  },
                  isClosed: { type: "boolean", default: false },
                },
              },
            },
          },
        },
        WorkingHoursResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["hours"],
              properties: {
                hours: {
                  type: "array",
                  items: { $ref: "#/components/schemas/WorkingHoursDay" },
                },
              },
            },
          },
        },
};
