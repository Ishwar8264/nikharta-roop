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

/** OpenAPI paths for payment transactions. */
export const paymentPaths = {
  "/api/v1/appointments/{appointmentId}/transactions": {
    get: {
      tags: ["Payments"],
      summary: "List an appointment's transactions",
      description:
        "Advance, final, and refund entries, newest first. The customer, " +
        "assigned staff, or salon manager can read them.",
      operationId: "listAppointmentTransactions",
      security: authenticatedRead,
      parameters: [
        { $ref: "#/components/parameters/CursorParam" },
        {
          name: "appointmentId",
          in: "path",
          required: true,
          schema: { $ref: "#/components/schemas/ResourceId" },
        },
      ],
      responses: {
        "200": {
          description: "Paginated transactions",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PaymentTransactionListResponse",
              },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": errorResponse("Appointment not found"),
      },
    },
    post: {
      tags: ["Payments"],
      summary: "Record a payment transaction",
      description:
        "Records an ADVANCE (token), FINAL, or REFUND entry. Refunds are " +
        "capped at the amount already collected. Always send the same " +
        "idempotencyKey when retrying — the platform deduplicates it.",
      operationId: "recordPaymentTransaction",
      security: authenticatedMutation,
      parameters: [
        {
          name: "appointmentId",
          in: "path",
          required: true,
          schema: { $ref: "#/components/schemas/ResourceId" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/CreatePaymentTransactionRequest",
            },
            examples: {
              advance: {
                summary: "Advance token",
                value: {
                  type: "ADVANCE",
                  amount: 200,
                  method: "UPI",
                  idempotencyKey: "adv-20261008-abc123",
                },
              },
              final: {
                summary: "Final payment",
                value: {
                  type: "FINAL",
                  amount: 800,
                  method: "CARD",
                  idempotencyKey: "fin-20261008-abc124",
                },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Transaction recorded",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PaymentTransactionResponse" },
            },
          },
        },
        "400": validationResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": errorResponse("Appointment not found"),
        "409": errorResponse("Idempotency key already used"),
      },
    },
  },
} as unknown as OpenAPIV3_1.PathsObject;

/** OpenAPI schemas for the payment module. */
export const paymentSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
  PaymentTransaction: {
    type: "object",
    required: [
      "id",
      "appointmentId",
      "type",
      "amount",
      "commission",
      "method",
      "gatewayRef",
      "createdAt",
    ],
    properties: {
      id: { type: "string" },
      appointmentId: { type: "string" },
      type: { type: "string", enum: ["ADVANCE", "FINAL", "REFUND"] },
      amount: { type: "number", description: "Amount in INR" },
      commission: { type: "number", description: "Platform cut in INR" },
      method: {
        type: "string",
        enum: ["CASH", "CARD", "UPI", "WALLET", "ONLINE"],
      },
      gatewayRef: { type: ["string", "null"] },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  PaymentTransactionListResponse: {
    type: "object",
    required: ["message", "data", "meta"],
    properties: {
      message: { type: "string" },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/PaymentTransaction" },
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
  PaymentTransactionResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["transaction"],
        properties: {
          transaction: { $ref: "#/components/schemas/PaymentTransaction" },
        },
      },
    },
  },
  CreatePaymentTransactionRequest: {
    type: "object",
    required: ["type", "amount", "method", "idempotencyKey"],
    properties: {
      type: { type: "string", enum: ["ADVANCE", "FINAL", "REFUND"] },
      amount: { type: "number", description: "Amount in INR" },
      method: {
        type: "string",
        enum: ["CASH", "CARD", "UPI", "WALLET", "ONLINE"],
      },
      commission: {
        type: "number",
        default: 0,
        description: "Platform cut; cannot exceed amount.",
      },
      gatewayRef: { type: "string" },
      idempotencyKey: {
        type: "string",
        minLength: 8,
        maxLength: 128,
        description: "Stable key for safe retries.",
      },
    },
  },
};
