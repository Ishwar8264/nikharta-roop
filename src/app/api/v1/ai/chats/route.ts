import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { AiInvalidContextError } from "@/server/modules/ai/ai.errors";
import {
  createChatSchema,
  listChatsQuerySchema,
} from "@/server/modules/ai/ai.schema";
import { createUserChat, listChats } from "@/server/modules/ai/ai.service";

/**
 * Lists the caller's AI chats.
 *
 * Why:
 * Cursor-paginated so the client can load older conversations lazily.
 * Scoped to `auth.sub` — the repository never exposes another user's chats.
 */
export async function GET(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const validation = listChatsQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );

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
    const result = await listChats(auth.sub, validation.data);

    return NextResponse.json(
      {
        message: "Chats retrieved",
        data: result.items,
        meta: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("AI chat listing failed", error);
    return NextResponse.json(
      { message: "Unable to list chats" },
      { status: 500 },
    );
  }
}

/**
 * Creates a new chat.
 *
 * Why:
 * `contextType` and `contextId` are validated at creation time. If the
 * reference is missing or the wrong shape, the request fails with 400
 * before any chat row exists — no zombie chats whose first message would
 * blow up on the server.
 */
export async function POST(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
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

  const validation = createChatSchema.safeParse(body);
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
    const chat = await createUserChat(auth.sub, validation.data);

    return NextResponse.json(
      { message: "Chat created", data: { chat } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AiInvalidContextError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("AI chat creation failed", error);
    return NextResponse.json(
      { message: "Unable to create chat" },
      { status: 500 },
    );
  }
}
