import type { OpenAPIV3_1 } from "openapi-types";
import { PARTNER_TERMS_VERSION } from "@/features/onboarding/policy";

const contactProperties: Record<string, OpenAPIV3_1.SchemaObject> = {
  accountType: { type: "string", enum: ["CUSTOMER", "SALON_PARTNER"] },
  name: { type: "string", minLength: 2, maxLength: 100 },
  phone: { type: "string", pattern: "^\\+[1-9]\\d{7,14}$" },
};
const errorResponses = {
  "400": { description: "Malformed JSON or validation failure" },
  "401": { description: "Authentication required" },
  "409": { description: "Phone already linked to an account" },
  "500": { description: "Unable to save account setup" },
};

/** Optional intent saves and validated completion never change roles or salon membership. */
export const onboardingPaths = {
  "/api/v1/auth/onboarding": {
    post: {
      tags: ["Authentication"],
      operationId: "completeAccountOnboarding",
      summary: "Complete customer or salon partner setup",
      description:
        "Updates only the authenticated account. Partners require authority confirmation and versioned consent. Phone verification is never granted by setup. Retries preserve consent timestamps.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["accountType", "name"],
              properties: {
                ...contactProperties,
                authorised: { type: "boolean" },
                acceptTerms: { type: "boolean" },
                termsVersion: { type: "string" },
              },
              oneOf: [
                { properties: { accountType: { const: "CUSTOMER" } } },
                {
                  required: [
                    "phone",
                    "authorised",
                    "acceptTerms",
                    "termsVersion",
                  ],
                  properties: {
                    accountType: { const: "SALON_PARTNER" },
                    authorised: { const: true },
                    acceptTerms: { const: true },
                    termsVersion: { const: PARTNER_TERMS_VERSION },
                  },
                },
              ],
            },
          },
        },
      },
      responses: {
        "200": {
          description:
            "Setup saved; data contains accountType and onboardingCompletedAt",
        },
        ...errorResponses,
      },
    },
    patch: {
      tags: ["Authentication"],
      operationId: "saveAccountOnboardingDraft",
      summary:
        "Save account intent and valid profile details without completing setup",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["accountType"],
              properties: contactProperties,
            },
          },
        },
      },
      responses: {
        "200": {
          description:
            "Preference saved; data contains accountType. Eligibility and consent are unchanged.",
        },
        ...errorResponses,
      },
    },
  },
} as unknown as OpenAPIV3_1.PathsObject;
