import "server-only";

import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { findAuthAccount } from "@/server/db";

/** Check current lifecycle state even when Redis contains an older cached session. */
export async function getActiveSession(requestHeaders?: Headers) {
  const session = await auth.api.getSession({ headers: requestHeaders ?? (await headers()) });
  if (!session) return null;
  const user = await findAuthAccount(session.user.id);
  if (!user || user.deletedAt || user.status !== "ACTIVE" || !user.emailVerified) return null;
  return { session: session.session, user: { ...session.user, ...user } };
}
