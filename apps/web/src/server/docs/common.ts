export const errorResponse = (description: string, rateLimited = false) => ({
  description,
  ...(rateLimited
    ? {
        headers: {
          "Retry-After": { description: "Seconds before retrying.", schema: { type: "integer" } },
        },
      }
    : {}),
  content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
});

export const commonSchemas = {
  ApiError: {
    type: "object",
    required: ["ok", "error"],
    properties: {
      ok: { type: "boolean", enum: [false] },
      error: {
        type: "object",
        required: ["code", "message"],
        properties: {
          code: { type: "string" },
          message: { type: "string" },
          details: {},
        },
      },
    },
  },
};
