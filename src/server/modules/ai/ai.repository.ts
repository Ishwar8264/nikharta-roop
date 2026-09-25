import "server-only";

import type { AiContextType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** Columns returned for every public chat. */
const PUBLIC_CHAT_SELECT = {
  id: true,
  title: true,
  contextType: true,
  contextId: true,
  createdAt: true,
} as const satisfies Prisma.AiChatSelect;

/** Columns returned for every public message. */
const PUBLIC_MESSAGE_SELECT = {
  id: true,
  role: true,
  content: true,
  tokens: true,
  createdAt: true,
} as const satisfies Prisma.AiMessageSelect;

/** Cursor-paginated list of the caller's chats. */
export async function listUserChats(
  userId: string,
  input: { cursor?: string; limit: number },
) {
  const rows = await prisma.aiChat.findMany({
    where: { userId },
    select: PUBLIC_CHAT_SELECT,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  };
}

/** Loads a chat by id, scoped to the owner. */
export async function findUserChat(userId: string, chatId: string) {
  return prisma.aiChat.findFirst({
    where: { id: chatId, userId },
    select: PUBLIC_CHAT_SELECT,
  });
}

/** Loads a chat's full message history in chronological order. */
export async function listChatMessages(chatId: string) {
  return prisma.aiMessage.findMany({
    where: { chatId },
    select: PUBLIC_MESSAGE_SELECT,
    orderBy: { createdAt: "asc" },
  });
}

/** Creates a chat row. */
export async function createChat(data: {
  userId: string;
  title: string | null;
  contextType: AiContextType;
  contextId: string | null;
}) {
  return prisma.aiChat.create({
    data,
    select: PUBLIC_CHAT_SELECT,
  });
}

/** Updates a chat's title. */
export async function updateChatTitle(chatId: string, title: string) {
  return prisma.aiChat.update({
    where: { id: chatId },
    data: { title },
    select: PUBLIC_CHAT_SELECT,
  });
}

/** Deletes a chat and its dependent rows. */
export async function deleteChat(chatId: string): Promise<void> {
  await prisma.$transaction([
    prisma.aiMessage.deleteMany({ where: { chatId } }),
    prisma.aiUsageLog.deleteMany({ where: { chatId } }),
    prisma.aiChat.delete({ where: { id: chatId } }),
  ]);
}

/**
 * Appends a user + assistant pair in one transaction.
 *
 * Why:
 * The streaming route calls this in the `onFinish` callback with the last
 * two messages from the request and the completed assistant reply. Writing
 * both rows in a single transaction means the pair is never half-persisted
 * if the connection drops mid-write.
 *
 * `tokens` is placed on the assistant row because that is where the model's
 * cost is realized.
 */
export async function appendMessagePair(input: {
  chatId: string;
  userContent: string;
  assistantContent: string;
  assistantTokens: number;
}) {
  await prisma.$transaction([
    prisma.aiMessage.create({
      data: {
        chatId: input.chatId,
        role: "user",
        content: input.userContent,
      },
    }),
    prisma.aiMessage.create({
      data: {
        chatId: input.chatId,
        role: "assistant",
        content: input.assistantContent,
        tokens: input.assistantTokens,
      },
    }),
  ]);
}

/**
 * Writes an AI usage log row for cost/token analytics.
 *
 * Why:
 * The `AiUsageLog` table powers per-model and per-period reporting, separate
 * from the quota counters on `UserAiUsage`. Failures are the caller's
 * responsibility to swallow so a logging problem never fails a request.
 */
export async function createUsageLog(data: {
  userId: string;
  chatId: string | null;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model: string;
  contextType: AiContextType;
  costUsd: number | null;
}) {
  return prisma.aiUsageLog.create({
    data,
    select: { id: true },
  });
}
