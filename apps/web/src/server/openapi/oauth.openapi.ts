import type { OpenAPIV3_1 } from "openapi-types";

/**
 * OpenAPI paths exposed by the OAuth module.
 *
 * Why:
 * Only the two consumer-facing endpoints are documented here. The three
 * callback routes (`/google/callback`, `/apple/callback`,
 * `/facebook/callback`) are infrastructure: they are invoked by the
 * provider's servers, not by API clients, and they respond with 302
 * redirects rather than JSON. Documenting them in Swagger would be
 * misleading and would invite API consumers to hit routes they cannot use.
 */
export const oauthPaths = {
  "/api/v1/auth/oauth/providers": {
    get: {
      tags: ["OAuth"],
      summary: "List configured OAuth providers",
      description:
        "Returns the social login providers this deployment has credentials " +
        "for. A provider whose environment variables are absent is silently " +
        "omitted, so the client never renders a button that would produce a " +
        "503. This endpoint is what a login page calls to decide which social " +
        "buttons to display.",
      operationId: "listOAuthProviders",
      security: [],
      responses: {
        "200": {
          description: "Configured providers",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/OAuthProviderListResponse",
              },
              examples: {
                configured: {
                  summary: "All three providers configured",
                  value: {
                    message: "OAuth providers retrieved",
                    data: [
                      {
                        id: "google",
                        displayName: "Google",
                        configured: true,
                      },
                      {
                        id: "apple",
                        displayName: "Apple",
                        configured: true,
                      },
                      {
                        id: "facebook",
                        displayName: "Facebook",
                        configured: true,
                      },
                    ],
                  },
                },
                none: {
                  summary: "No providers configured (local dev)",
                  value: {
                    message: "OAuth providers retrieved",
                    data: [],
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  "/api/v1/auth/oauth/{providerId}": {
    get: {
      tags: ["OAuth"],
      summary: "Start an OAuth login flow",
      description:
        "Redirects the caller's browser to the chosen provider's " +
        "authentication page. On success the provider eventually redirects " +
        "back to the matching `/callback` route, which sets the session " +
        "cookies and forwards the user to the post-login destination.\n\n" +
        "**This endpoint returns a `302` redirect, not JSON.** It is meant " +
        "to be visited by a browser navigation (e.g. `<a href>` or " +
        "`window.location.href`), not called by an HTTP client.\n\n" +
        "**State binding:** each flow mints a state value prefixed with the " +
        "provider id (e.g. `google:<random>`). The callback rejects any " +
        "state that was not minted by the same provider, which closes the " +
        "class of bug described by CVE-2026-73419 in Auth.js.\n\n" +
        "**PKCE:** every flow uses S256. The verifier is stored in an " +
        "httpOnly cookie and only the server that started the flow can " +
        "complete the token exchange.",
      operationId: "startOAuthFlow",
      security: [],
      parameters: [
        {
          name: "providerId",
          in: "path",
          required: true,
          description: "The provider to authenticate with.",
          schema: {
            type: "string",
            enum: ["google", "apple", "facebook"],
          },
        },
      ],
      responses: {
        "302": {
          description:
            "Redirect to the provider's authorization page. If the provider " +
            "is not configured in the environment the response redirects to " +
            "the configured `OAUTH_FAILURE_REDIRECT` instead.",
          headers: {
            Location: {
              description: "Target URL for the browser navigation.",
              schema: { type: "string", format: "uri" },
            },
            "Set-Cookie": {
              description:
                "Two httpOnly cookies (`oauth_state`, `oauth_verifier`) " +
                "used to complete the flow on the callback. Both carry " +
                "`SameSite=Lax` so the top-level navigation back from the " +
                "provider includes them.",
              schema: { type: "string" },
            },
          },
        },
      },
    },
  },
} as unknown as OpenAPIV3_1.PathsObject;

/** Reusable OpenAPI schemas exposed by the OAuth module. */
export const oauthSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
  OAuthProviderId: {
    type: "string",
    enum: ["google", "apple", "facebook"],
  },
  OAuthProvider: {
    type: "object",
    required: ["id", "displayName", "configured"],
    properties: {
      id: { $ref: "#/components/schemas/OAuthProviderId" },
      displayName: {
        type: "string",
        description: "Human-readable provider name for button labels.",
        example: "Google",
      },
      configured: {
        type: "boolean",
        description:
          "Always `true` in this response — providers without credentials " +
          "are filtered out before the response is built.",
      },
    },
  },
  OAuthProviderListResponse: {
    type: "object",
    required: ["message", "data"],
    properties: {
      message: {
        type: "string",
        const: "OAuth providers retrieved",
      },
      data: {
        type: "array",
        items: { $ref: "#/components/schemas/OAuthProvider" },
      },
    },
  },
};
