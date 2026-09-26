import "server-only";

import type { AiContextType } from "@/generated/prisma/client";

import { assertContextValid, buildSystemPrompt } from "./ai.context";
import { AiChatNotFoundError } from "./ai.errors";
import { toPublicChat, toPublicMessage } from "./ai.mapper";
import {
  enforceQuota,
  ensureUsageRow,
  rolloverExpiredWindows,
} from "./ai.quota";
import {
  appendMessagePair,
  createChat,
  createUsageLog,
  deleteChat,
  findUserChat,
  listChatMessages,
  listUserChats,
  updateChatTitle,
} from "./ai.repository";
import type {
  AiUsageSummary,
  CreateChatInput,
  ListChatsQuery,
  PaginatedChats,
  PublicChat,
  PublicChatWithMessages,
  TokenUsage,
  UpdateChatInput,
} from "./ai.types";

/**
 * Per-model pricing used only for analytics, never for billing.
 *
 * Why:
 * The `AiUsageLog` table records the estimated USD cost so operations can
 * spot a model that is suddenly expensive. Values are rough USD per token
 * and can drift from actual invoices — the field is a signal, not a ledger.
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
  "gpt-4o": { input: 5 / 1_000_000, output: 15 / 1_000_000 },
};

/** Lists the caller's chats. */
export async function listChats(
  userId: string,
  query: ListChatsQuery,
): Promise<PaginatedChats> {
  const result = await listUserChats(userId, query);
  return {
    items: result.items.map(toPublicChat),
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}

/** Loads one chat with its message history. */
export async function getChat(
  userId: string,
  chatId: string,
): Promise<PublicChatWithMessages> {
  const chat = await findUserChat(userId, chatId);
  if (!chat) throw new AiChatNotFoundError();

  const messages = await listChatMessages(chatId);

  return {
    chat: toPublicChat(chat),
    messages: messages.map(toPublicMessage),
  };
}

/**
 * Creates a chat.
 *
 * Why:
 * The context is validated before the row is inserted so the user never ends
 * up with a chat whose system prompt would throw on the first message. The
 * title is optional — clients typically rename after the first reply.
 */
export async function createUserChat(
  userId: string,
  input: CreateChatInput,
): Promise<PublicChat> {
  const contextType: AiContextType = input.contextType;
  const contextId = input.contextId ?? null;

  await assertContextValid({ contextType, contextId });

  const chat = await createChat({
    userId,
    title: input.title ?? null,
    contextType,
    contextId,
  });

  return toPublicChat(chat);
}

/** Renames a chat. */
export async function renameChat(
  userId: string,
  chatId: string,
  input: UpdateChatInput,
): Promise<PublicChat> {
  const chat = await findUserChat(userId, chatId);
  if (!chat) throw new AiChatNotFoundError();

  const updated = await updateChatTitle(chatId, input.title);
  return toPublicChat(updated);
}

/** Deletes a chat and its dependent rows. */
export async function removeChat(
  userId: string,
  chatId: string,
): Promise<void> {
  const chat = await findUserChat(userId, chatId);
  if (!chat) throw new AiChatNotFoundError();
  await deleteChat(chatId);
}

/**
 * Returns the caller's quota summary.
 *
 * Why:
 * Rolls forward any expired windows first so the numbers the client sees
 * match what `enforceQuota` would use on the next request.
 */
export async function getUsage(userId: string): Promise<AiUsageSummary> {
  const row = await rolloverExpiredWindows(userId);
  return {
    isBlocked: row.isBlocked,
    blockReason: row.blockReason,
    daily: {
      used: row.dailyUsed,
      limit: row.dailyLimit,
      resetAt: row.dailyResetAt,
    },
    weekly: {
      used: row.weeklyUsed,
      limit: row.weeklyLimit,
      resetAt: row.weeklyResetAt,
    },
    monthly: {
      used: row.monthlyUsed,
      limit: row.monthlyLimit,
      resetAt: row.monthlyResetAt,
    },
  };
}

/**
 * Prepares a streaming turn — validates ownership, quota, and returns the
 * pieces the route needs to call `streamText`.
 *
 * Why:
 * The route handler has enough going on (parsing, streaming, callbacks).
 * Hoisting every guard and lookup into this function keeps the route to a
 * dozen lines and makes the streaming path testable in isolation.
 */
export async function prepareStreamingTurn(input: {
  userId: string;
  chatId: string;
}): Promise<{ chat: PublicChat; systemPrompt: string }> {
  const chat = await findUserChat(input.userId, input.chatId);
  if (!chat) throw new AiChatNotFoundError();

  await enforceQuota(input.userId);
  await ensureUsageRow(input.userId);

  const systemPrompt = await buildSystemPrompt({
    contextType: chat.contextType,
    contextId: chat.contextId,
  });

  return { chat: toPublicChat(chat), systemPrompt };
}

/**
 * Persists the outcome of a completed streaming turn.
 *
 * Why:
 * Called from `onFinish` — the last hook that runs on the server after the
 * stream closes. Writes the user + assistant pair and the analytics log.
 * Any failure is logged and swallowed: the client has already received the
 * response, so surfacing an error would be useless.
 */
export async function finalizeStreamingTurn(input: {
  userId: string;
  chatId: string;
  contextType: AiContextType;
  userContent: string;
  assistantContent: string;
  usage: TokenUsage;
  modelId: string;
}): Promise<void> {
  try {
    await appendMessagePair({
      chatId: input.chatId,
      userContent: input.userContent,
      assistantContent: input.assistantContent,
      assistantTokens: input.usage.outputTokens,
    });

    const pricing = MODEL_PRICING[input.modelId];
    const costUsd = pricing
      ? input.usage.inputTokens * pricing.input +
        input.usage.outputTokens * pricing.output
      : null;

    await createUsageLog({
      userId: input.userId,
      chatId: input.chatId,
      inputTokens: input.usage.inputTokens,
      outputTokens: input.usage.outputTokens,
      totalTokens: input.usage.totalTokens,
      model: input.modelId,
      contextType: input.contextType,
      costUsd,
    });
  } catch (error) {
    console.error("AI streaming finalize failed", input.chatId, error);
  }
}
