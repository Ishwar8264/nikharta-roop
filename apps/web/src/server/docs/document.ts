import "server-only";

import { AUTH_BASE_PATH } from "@nikharta-roop/shared";
import { auth } from "@/server/auth";
import { accountPaths, accountSchemas } from "./account";
import { commonSchemas } from "./common";
import { healthPaths, healthSchemas } from "./health";
import { profilePaths, profileSchemas } from "./profile";

/** Combine generated auth operations with feature docs; no separate schema route is exposed. */
export async function getApiDocument() {
  const authDocument = await auth.api.generateOpenAPISchema();
  const authPaths = Object.fromEntries(
    Object.entries(authDocument.paths).map(([path, operation]) => [
      `${AUTH_BASE_PATH}${path}`,
      operation,
    ]),
  );

  return {
    ...authDocument,
    info: {
      title: "Nikharta Roop API",
      version: "1.0.0",
      description:
        "Versioned auth, account, profile and health APIs. Auth uses native Better Auth responses; other APIs use the shared JSON envelope.",
    },
    servers: [{ url: "/" }],
    paths: { ...authPaths, ...profilePaths, ...accountPaths, ...healthPaths },
    components: {
      ...authDocument.components,
      schemas: {
        ...authDocument.components?.schemas,
        ...profileSchemas,
        ...accountSchemas,
        ...commonSchemas,
        ...healthSchemas,
      },
    },
  };
}
