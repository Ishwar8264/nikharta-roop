import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  AiChatNotFoundError,
  AiInvalidContextError,
  AiProviderNotConfiguredError,
  AiQuotaExceededError,
} from "@/server/modules/ai/ai.errors";
import {
  chatIdParamSchema,
  sendMessageSchema,
} from "@/server/modules/ai/ai.schema";
import {
  finalizeStreamingTurn,
  prepareStreamingTurn,
} from "@/server/modules/ai/ai.service";
import {
  getActiveModel,
  getActiveModelId,
  isAiConfigured,
} from "@/server/modules/ai/providers";

/**
 * Streaming runs on the Node.js runtime.
 *
 * Why:
 * The handler writes to Postgres in the `onFinish` callback via Prisma,
 * which requires Node APIs. Edge would work only with a remote database
 * proxy — the extra moving part is not worth the cold-start win on a
 * request that is dominated by the model's thinking time.
 */
export const runtime = "nodejs";

/**
 * Upper bound on the total response time, enforced by the platform.
 *
 * Why:
 * Streaming responses that never close are the fastest way to burn through
 * a serverless budget. 60s is long enough for a full multi-paragraph answer
 * and short enough to protect the function from a runaway client.
 */
export const maxDuration = 60;

/**
 * Streams an AI response to the caller.
 *
 * Why:
 * This is the only place the app touches the AI SDK. Everything else — the
 * quota guards, the context prompt, the persistence of the final turn — is
 * delegated to the service layer, so the route stays a small coordinator.
 *
 * The abort signal is intentionally forwarded. When the browser closes the
 * connection, the platform aborts the request, and without that signal
 * `streamText` would keep generating (and charging) tokens in the
 * background until the model finishes.
 */
export async function POST(
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

  // Fail fast when no provider is configured so the client sees a clear 503
  // instead of a half-open stream that never produces tokens.
  if (!isAiConfigured()) {
    return NextResponse.json(
      { message: "AI provider is not configured" },
      { status: 503 },
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

  const bodyValidation = sendMessageSchema.safeParse(body);
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

  // Ownership + quota + system prompt resolution, all in one call.
  let prep: Awaited<ReturnType<typeof prepareStreamingTurn>>;
  try {
    prep = await prepareStreamingTurn({
      userId: auth.sub,
      chatId: paramValidation.data.chatId,
    });
  } catch (error) {
    if (error instanceof AiChatNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof AiQuotaExceededError) {
      return NextResponse.json(
        {
          message: error.message,
          data: {
            scope: error.scope,
            limit: error.limit,
            used: error.used,
            resetAt: error.resetAt,
          },
        },
        { status: 429 },
      );
    }
    if (error instanceof AiProviderNotConfiguredError) {
      return NextResponse.json({ message: error.message }, { status: 503 });
    }
    if (error instanceof AiInvalidContextError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("AI streaming preparation failed", error);
    return NextResponse.json(
      { message: "Unable to start the response" },
      { status: 500 },
    );
  }

  // The schema accepts a loose message shape; cast to the SDK's UIMessage
  // type here so the rest of the handler can stay strictly typed. If the
  // payload is malformed the SDK will reject it on the next line.
  const uiMessages = bodyValidation.data.messages as unknown as UIMessage[];

  // Extract the last user message's text once, up front. The onFinish
  // callback needs it to persist the pair, and parsing it there would
  // duplicate this logic.
  const lastUserContent = extractLastUserText(uiMessages);
  const modelId = getActiveModelId();

  const result = streamText({
    model: getActiveModel(),
    system: prep.systemPrompt,
    messages: await convertToModelMessages(uiMessages),
    // Forward client aborts so generation stops the moment the browser
    // walks away, preventing background token burn.
    abortSignal: request.signal,
    // Bound tool-calling loops. The current build uses no tools, but this
    // guard keeps a future tool addition from becoming an infinite loop.
    stopWhen: stepCountIs(5),
    onFinish: async ({ text, usage }) => {
      await finalizeStreamingTurn({
        userId: auth.sub,
        chatId: prep.chat.id,
        contextType: prep.chat.contextType,
        userContent: lastUserContent,
        assistantContent: text,
        usage: {
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
          totalTokens: usage.totalTokens ?? 0,
        },
        modelId,
      });
    },
  });

  return result.toUIMessageStreamResponse();
}

/**
 * Extracts the concatenated text of the last user message.
 *
 * Why:
 * `UIMessage.parts` can mix text, tool calls, and files. Only the text
 * fragments are relevant to persistence, and returning an empty string for
 * a message with no text keeps the caller from having to check for null.
 */
function extractLastUserText(messages: UIMessage[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser || !lastUser.parts) return "";

  return lastUser.parts
    .filter(
      (part): part is { type: "text"; text: string } =>
        typeof part === "object" &&
        part !== null &&
        "type" in part &&
        (part as { type: string }).type === "text" &&
        "text" in part &&
        typeof (part as { text: unknown }).text === "string",
    )
    .map((part) => part.text)
    .join("\n")
    .trim();
}
