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

function idParameter(name: string): OpenAPIV3.ParameterObject {
  return {
    name,
    in: "path",
    required: true,
    schema: { $ref: "#/components/schemas/ResourceId" },
  };
}

/** OpenAPI paths exposed by the loyalty module. */
export const loyaltyPaths = {
  "/api/v1/loyalty/balance": {
    get: {
      tags: ["Loyalty"],
      summary: "Get the current loyalty balance",
      description:
        "Returns the caller's loyalty point balance together with the " +
        "applied earn and redeem rates so the UI can display them without a " +
        "second request.",
      operationId: "getLoyaltyBalance",
      security: authenticatedRead,
      responses: {
        "200": {
          description: "Balance and rates",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoyaltyBalanceResponse",
              },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/v1/loyalty/transactions": {
    get: {
      tags: ["Loyalty"],
      summary: "List the caller's loyalty transactions",
      operationId: "listLoyaltyTransactions",
      security: authenticatedRead,
      parameters: [
        { $ref: "#/components/parameters/CursorParam" },
        { $ref: "#/components/parameters/LimitParam" },
        {
          name: "type",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: ["EARNED", "REDEEMED", "EXPIRED", "REFUNDED"],
          },
        },
      ],
      responses: {
        "200": {
          description: "Paginated ledger",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoyaltyTransactionListResponse",
              },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/api/v1/loyalty/transactions/{txnId}": {
    get: {
      tags: ["Loyalty"],
      summary: "Get a single loyalty transaction",
      operationId: "getLoyaltyTransaction",
      security: authenticatedRead,
      parameters: [idParameter("txnId")],
      responses: {
        "200": {
          description: "Transaction detail",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoyaltyTransactionResponse",
              },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": errorResponse("Transaction not found for this user"),
      },
    },
  },
  "/api/v1/loyalty/redeem": {
    post: {
      tags: ["Loyalty"],
      summary: "Redeem points for a rupee discount",
      description:
        "Atomically decrements the caller's balance and writes a REDEEMED " +
        "ledger entry. Returns the rupee discount value. Insufficient " +
        "balance returns 409.",
      operationId: "redeemLoyaltyPoints",
      security: authenticatedMutation,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RedeemPointsRequest" },
          },
        },
      },
      responses: {
        "200": {
          description: "Points redeemed",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RedeemPointsResponse",
              },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "409": errorResponse("Insufficient points for this redemption"),
      },
    },
  },
} as unknown as OpenAPIV3_1.PathsObject;

const loyaltyTxnTypeSchema: OpenAPIV3_1.SchemaObject = {
  type: "string",
  enum: ["EARNED", "REDEEMED", "EXPIRED", "REFUNDED"],
};

/** Reusable OpenAPI schemas exposed by the loyalty module. */
export const loyaltySchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
  LoyaltyBalance: {
    type: "object",
    required: [
      "points",
      "pointsValueRupees",
      "earnRatePerRupee",
      "redeemRatePerPoint",
    ],
    properties: {
      points: { type: "integer", minimum: 0 },
      pointsValueRupees: { type: "number", minimum: 0 },
      earnRatePerRupee: { type: "number", minimum: 0 },
      redeemRatePerPoint: { type: "number", minimum: 0 },
    },
  },
  LoyaltyTransaction: {
    type: "object",
    required: [
      "id",
      "points",
      "type",
      "description",
      "referenceId",
      "createdAt",
    ],
    properties: {
      id: { $ref: "#/components/schemas/ResourceId" },
      points: {
        type: "integer",
        description:
          "Signed value: positive for EARNED, negative for REDEEMED.",
      },
      type: loyaltyTxnTypeSchema,
      description: { type: ["string", "null"] },
      referenceId: {
        oneOf: [{ $ref: "#/components/schemas/ResourceId" }, { type: "null" }],
      },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  RedeemPointsRequest: {
    type: "object",
    additionalProperties: false,
    required: ["points"],
    properties: {
      points: { type: "integer", minimum: 1, maximum: 1000000 },
      appointmentId: {
        oneOf: [{ $ref: "#/components/schemas/ResourceId" }, { type: "null" }],
      },
      description: { type: "string", maxLength: 500 },
    },
  },
  LoyaltyBalanceResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["balance"],
        properties: {
          balance: { $ref: "#/components/schemas/LoyaltyBalance" },
        },
      },
    },
  },
  LoyaltyTransactionResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["transaction"],
        properties: {
          transaction: { $ref: "#/components/schemas/LoyaltyTransaction" },
        },
      },
    },
  },
  LoyaltyTransactionListResponse: {
    type: "object",
    required: ["message", "data", "meta"],
    properties: {
      message: { type: "string" },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/LoyaltyTransaction" },
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
  RedeemPointsResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: [
          "transaction",
          "pointsRedeemed",
          "discountRupees",
          "remainingPoints",
        ],
        properties: {
          transaction: { $ref: "#/components/schemas/LoyaltyTransaction" },
          pointsRedeemed: { type: "integer", minimum: 1 },
          discountRupees: { type: "number", minimum: 0 },
          remainingPoints: { type: "integer", minimum: 0 },
        },
      },
    },
  },
};
