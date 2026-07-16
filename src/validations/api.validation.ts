import { z } from "zod";

// Validate the common error envelope returned by every API route.
const apiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string().min(1),
});

// Build a reusable response schema around each endpoint-specific data schema.
export const createApiResponseSchema = <TData extends z.ZodTypeAny>(
  dataSchema: TData,
) =>
  // Discriminate by success so consumers receive correctly narrowed response data.
  z.discriminatedUnion("success", [
    // Validate successful responses with the endpoint's exact data contract.
    z.object({
      success: z.literal(true),
      data: dataSchema,
    }),
    // Reuse the standard error response for every endpoint.
    apiErrorResponseSchema,
  ]);
