import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

/** Cookie-auth mutations require the CSRF double-submit token. */
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

function idParameter(name: string): OpenAPIV3.ParameterObject {
  return {
    name,
    in: "path",
    required: true,
    schema: { $ref: "#/components/schemas/ResourceId" },
  };
}

function queryIdParameter(name: string): OpenAPIV3.ParameterObject {
  return {
    name,
    in: "query",
    required: true,
    schema: { $ref: "#/components/schemas/ResourceId" },
  };
}

const targetTypeQueryParameter: OpenAPIV3.ParameterObject = {
  name: "type",
  in: "query",
  required: true,
  schema: {
    type: "string",
    enum: ["salon", "service", "product"],
  },
};

/** OpenAPI paths exposed by the favorites module. */
export const favoritePaths = {
  "/api/v1/favorites": {
    get: {
      tags: ["Favorites"],
      summary: "List the current user's favorites",
      description:
        "Cursor-paginated list of the authenticated user's favorites. " +
        "Filter by `type` to narrow to salons, services, or products.",
      operationId: "listFavorites",
      security: [{ bearerAuth: [] }, { accessCookie: [] }],
      parameters: [
        { $ref: "#/components/parameters/CursorParam" },
        { $ref: "#/components/parameters/LimitParam" },
        {
          name: "type",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: ["salon", "service", "product"],
          },
        },
      ],
      responses: {
        "200": {
          description: "Paginated favorites",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/FavoriteListResponse",
              },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
    post: {
      tags: ["Favorites"],
      summary: "Add a favorite",
      description:
        "Adds a salon, service, or product to the caller's favorites. " +
        "The pair (userId, target) is unique — duplicate inserts return 409.",
      operationId: "addFavorite",
      security: authenticatedMutation,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AddFavoriteRequest" },
          },
        },
      },
      responses: {
        "201": {
          description: "Favorite added",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FavoriteResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": errorResponse("Favorite target not found"),
        "409": errorResponse("Target already favorited by this user"),
      },
    },
  },
  "/api/v1/favorites/{favoriteId}": {
    delete: {
      tags: ["Favorites"],
      summary: "Remove a favorite",
      description: "Removes one of the caller's own favorites.",
      operationId: "removeFavorite",
      security: authenticatedMutation,
      parameters: [idParameter("favoriteId")],
      responses: {
        "200": {
          description: "Favorite removed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DeleteFavoriteResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": errorResponse("Favorite not found for this user"),
      },
    },
  },
  "/api/v1/favorites/check": {
    get: {
      tags: ["Favorites"],
      summary: "Check whether a target is favorited",
      description:
        "Returns whether the given target is in the caller's favorites. " +
        "Used by clients to render filled/empty state without paginating.",
      operationId: "checkFavorite",
      security: [{ bearerAuth: [] }, { accessCookie: [] }],
      parameters: [targetTypeQueryParameter, queryIdParameter("targetId")],
      responses: {
        "200": {
          description: "Check result",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/FavoriteCheckResponse",
              },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
} as unknown as OpenAPIV3_1.PathsObject;

const favoriteTargetSummarySchema: OpenAPIV3_1.SchemaObject = {
  type: "object",
  required: ["id", "name", "slug", "images"],
  properties: {
    id: { $ref: "#/components/schemas/ResourceId" },
    name: { type: "string" },
    slug: { type: "string" },
    images: {
      type: "array",
      items: { type: "string", format: "uri" },
    },
  },
};

/** Reusable OpenAPI schemas exposed by the favorites module. */
export const favoriteSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
  FavoriteTarget: favoriteTargetSummarySchema,
  Favorite: {
    type: "object",
    required: ["id", "type", "targetId", "createdAt", "target"],
    properties: {
      id: { $ref: "#/components/schemas/ResourceId" },
      type: {
        type: "string",
        enum: ["salon", "service", "product"],
      },
      targetId: { $ref: "#/components/schemas/ResourceId" },
      createdAt: { type: "string", format: "date-time" },
      target: {
        $ref: "#/components/schemas/FavoriteTarget",
      },
    },
  },
  AddFavoriteRequest: {
    type: "object",
    additionalProperties: false,
    required: ["type", "targetId"],
    properties: {
      type: {
        type: "string",
        enum: ["salon", "service", "product"],
      },
      targetId: { $ref: "#/components/schemas/ResourceId" },
    },
  },
  FavoriteResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["favorite"],
        properties: {
          favorite: { $ref: "#/components/schemas/Favorite" },
        },
      },
    },
  },
  FavoriteListResponse: {
    type: "object",
    required: ["message", "data", "meta"],
    properties: {
      message: { type: "string" },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/Favorite" },
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
  FavoriteCheckResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["isFavorited", "favoriteId"],
        properties: {
          isFavorited: { type: "boolean" },
          favoriteId: {
            oneOf: [
              { $ref: "#/components/schemas/ResourceId" },
              { type: "null" },
            ],
          },
        },
      },
    },
  },
  DeleteFavoriteResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: { type: "null" },
    },
  },
};
