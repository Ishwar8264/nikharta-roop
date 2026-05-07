import { getDb } from "@/db";
import {
  AUTH_EVENT_CODES,
  AUTH_EVENT_MESSAGES,
} from "@/features/auth-events/constants/auth-event.constants";
import { authEventSelect } from "@/features/auth-events/helpers/auth-event.selectors";
import {
  listAuthEventsQuerySchema,
  type ListAuthEventsQueryInput,
} from "@/schema/auth-events/schema.auth-event";
import { handleAuthEventError } from "./auth-event.errors";
import { resolveAuthEventBranch } from "./auth-event.scopes";
import { authEventListResponse, parseAuthEventQuery } from "./auth-event-list.shared";
import { requireAuthEventAdmin, type AuthEventAdminUser } from "./auth-event.shared";

/**
 * Handles admin auth event listing requests.
 */
export async function handleListAuthEvents(request: Request) {
  const auth = await requireAuthEventAdmin(request);
  if (!auth.success) return auth.error;
  const query = parseAuthEventQuery(request, listAuthEventsQuerySchema);
  if (!query.success) return query.error;
  return listAuthEvents(query.data, auth.session.user);
}

/**
 * Lists auth events with branch-admin scoping and audit filters.
 */
async function listAuthEvents(
  input: ListAuthEventsQueryInput,
  admin: AuthEventAdminUser,
) {
  try {
    const branchId = resolveAuthEventBranch(input.branchId, admin);
    const events = await getDb().authEvent.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: authEventSelect(),
      take: input.limit,
      where: {
        createdAt: createdAtRange(input),
        mobile: input.mobile,
        type: input.type,
        user: branchId ? { branchId } : undefined,
        userId: input.userId,
      },
    });
    return authEventListResponse(events, input.limit);
  } catch (error) {
    return handleAuthEventError(error, {
      code: AUTH_EVENT_CODES.EVENT_LOAD_FAILED,
      handler: "listAuthEvents",
      message: AUTH_EVENT_MESSAGES.EVENT_LOAD_FAILED,
    });
  }
}

/**
 * Builds optional auth event created-at range filters.
 */
function createdAtRange(input: ListAuthEventsQueryInput) {
  return {
    gte: input.from ? new Date(`${input.from}T00:00:00.000Z`) : undefined,
    lte: input.to ? new Date(`${input.to}T23:59:59.999Z`) : undefined,
  };
}
