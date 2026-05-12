import type { Prisma } from "@prisma/client";

import { authEventSelect } from "./auth-event.selectors";

export type AuthEventRow = Prisma.AuthEventGetPayload<{
  select: ReturnType<typeof authEventSelect>;
}>;

/**
 * Normalizes one auth event row for public admin responses.
 */
export function toPublicAuthEvent(event: AuthEventRow) {
  return event;
}
