import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { AiChatNotFoundError } from "@/server/modules/ai/ai.errors";
import {
  chatIdParamSchema,
  updateChatSchema,
} from "@/server/modules/ai/ai.schema";
import {
  getChat,
  removeChat,
  renameChat,
} from "@/server/modules/ai/ai.service";

/**
 * Loads one chat together with its full message history.
 *
 * Why:
 * The history is returned in one payload because the client cannot render a
 * conversation without it. Pagination is intentionally not exposed — chats
 * are small and a paginated history would force the UI to stitch pages.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ chatId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const validation = chatIdParamSchema.safeParse(params);
  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const result = await getChat(auth.sub, validation.data.chatId);

    return NextResponse.json(
      { message: "Chat retrieved", data: result },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AiChatNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    console.error("AI chat detail failed", error);
    return NextResponse.json(
      { message: "Unable to load chat" },
      { status: 500 },
    );
  }
}

/**
 * Renames a chat.
 *
 * Why:
 * Only `title` is mutable here. Changing the context type after messages
 * exist would silently rewrite the system prompt mid-conversation, which is
 * almost never what the caller wants and is very hard to reason about in
 * support. Immutable context keeps the audit trail clean.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ chatId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = chatIdParamSchema.safeParse(params);
  if (!paramValidation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: paramValidation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const bodyValidation = updateChatSchema.safeParse(body);
  if (!bodyValidation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: bodyValidation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const chat = await renameChat(
      auth.sub,
      paramValidation.data.chatId,
      bodyValidation.data,
    );

    return NextResponse.json(
      { message: "Chat updated", data: { chat } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AiChatNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    console.error("AI chat update failed", error);
    return NextResponse.json(
      { message: "Unable to update chat" },
      { status: 500 },
    );
  }
}

/**
 * Deletes a chat and every message in it.
 *
 * Why:
 * Cascading deletes run inside the repository transaction so a message
 * cleanup failure cannot leave an orphaned chat with no messages. The
 * caller's ownership is verified before anything is removed.
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ chatId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const validation = chatIdParamSchema.safeParse(params);
  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    await removeChat(auth.sub, validation.data.chatId);

    return NextResponse.json(
      { message: "Chat deleted", data: null },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AiChatNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    console.error("AI chat delete failed", error);
    return NextResponse.json(
      { message: "Unable to delete chat" },
      { status: 500 },
    );
  }
}
