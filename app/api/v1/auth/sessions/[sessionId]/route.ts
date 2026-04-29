import { handleRevokeSession } from "@/features/auth/handlers/auth.handlers";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;

  return handleRevokeSession(request, sessionId);
}
