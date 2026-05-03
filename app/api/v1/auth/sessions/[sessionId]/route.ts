import { handleRevokeSession } from "@/features/auth/handlers/auth.handlers";

export const runtime = "nodejs";

/**
 * Routes current-user session revoke requests to the auth handler.
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;

  return handleRevokeSession(request, sessionId);
}
