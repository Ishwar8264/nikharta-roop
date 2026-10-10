import type { OpenAPIV3_1 } from "openapi-types";

import { slugResources } from "@/server/modules/slug/slug.schema";

export const slugPaths: OpenAPIV3_1.PathsObject = {
  "/api/v1/slugs/availability": {
    get: {
      tags: ["Slugs"],
      operationId: "checkSlugAvailability",
      summary: "Check whether a resource slug is available",
      description: "Authenticated, read-only check. Salon slugs are global; service/product/package slugs are unique within salonId and require OWNER or MANAGER membership. Categories and blog namespaces require SUPER_ADMIN. Inactive, draft and soft-deleted records still occupy their slugs. Service slug 'create' is reserved. This check does not reserve a slug; final creation can still return a conflict. Unknown and repeated query parameters are rejected. Slugs are trimmed but not automatically lowercased or slugified.",
      security: [{ bearerAuth: [] }, { accessCookie: [] }],
      parameters: [
        { name: "resource", in: "query", required: true, schema: { type: "string", enum: [...slugResources] } },
        { name: "slug", in: "query", required: true, description: "Lowercase letters/numbers separated by single hyphens. Minimum 2 characters; maximum 80, or 120 for blog namespaces.", schema: { type: "string", minLength: 2, maxLength: 120, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" }, example: "nikharta-roop" },
        { name: "salonId", in: "query", description: "Required only for service, product and package. Internal salon identifier, not its slug.", schema: { type: "string", pattern: "^(?:[a-f0-9]{48}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$" } },
      ],
      responses: {
        "200": {
          description: "Availability result (taken/reserved slugs also return 200)",
          headers: { "Cache-Control": { schema: { type: "string", enum: ["no-store"] } } },
          content: { "application/json": {
            schema: { $ref: "#/components/schemas/SlugAvailabilityResponse" },
            example: { message: "Slug availability checked", data: { resource: "salon", slug: "nikharta-roop", available: false, reason: "taken" } },
          } },
        },
        "400": {
          description: "Invalid, unsupported or repeated query parameters",
          content: { "application/json": { schema: { oneOf: [
            { $ref: "#/components/schemas/ValidationErrorResponse" },
            { $ref: "#/components/schemas/ErrorResponse" },
          ] } } },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "403": { $ref: "#/components/responses/Forbidden" },
        "404": { description: "Salon not found or not accessible to this caller" },
        "429": { description: "Existing API rate limit exceeded" },
        "500": { description: "Unable to check slug availability" },
      },
    },
  },
};

export const slugSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
  SlugAvailabilityResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: { type: "string" },
      data: {
        type: "object",
        required: ["resource", "slug", "available", "reason"],
        properties: {
          resource: { type: "string", enum: [...slugResources] },
          slug: { type: "string" },
          salonId: { type: "string" },
          available: { type: "boolean" },
          reason: { type: ["string", "null"], enum: ["taken", "reserved", null] },
        },
      },
    },
  },
};
