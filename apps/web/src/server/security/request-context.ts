import "server-only";

import type { PlatformRole } from "@nikharta-roop/db/client";

/** Existing protected APIs fail closed until replacement auth is implemented. */
export type AuthContext = { sub: string; role: PlatformRole };

export async function getAuthContext(
  request: Request,
): Promise<AuthContext | null> {
  void request;
  return null;
}
