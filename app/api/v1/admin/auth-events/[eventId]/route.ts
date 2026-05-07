import { handleGetAuthEvent } from "@/features/auth-events/handlers/auth-event.handlers";

export const runtime = "nodejs";

type AdminAuthEventRouteContext = {
  params: Promise<{ eventId: string }>;
};

/**
 * Routes admin auth event detail requests to the auth-events feature handler.
 */
export async function GET(request: Request, context: AdminAuthEventRouteContext) {
  const { eventId } = await context.params;
  return handleGetAuthEvent(request, eventId);
}
