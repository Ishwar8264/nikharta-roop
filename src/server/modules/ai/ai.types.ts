import type { z } from "zod";

import type { AiContextType } from "@/generated/prisma/client";

import type {
  createChatSchema,
  listChatsQuerySchema,
  sendMessageSchema,
  updateChatSchema,
} from "./ai.schema";

export type CreateChatInput = z.infer<typeof createChatSchema>;
export type UpdateChatInput = z.infer<typeof updateChatSchema>;
export type ListChatsQuery = z.infer<typeof listChatsQuerySchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

/** Public shape of a chat. */
export interface PublicChat {
  id: string;
  title: string | null;
  contextType: AiContextType;
  contextId: string | null;
  createdAt: Date;
}

/** Public shape of a message. */
export interface PublicMessage {
  id: string;
  role: string;
  content: string;
  tokens: number;
  createdAt: Date;
}

/** Chat with its full message history. */
export interface PublicChatWithMessages {
  chat: PublicChat;
  messages: PublicMessage[];
}

export interface PaginatedChats {
  items: PublicChat[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Quota summary returned to the client.
 *
 * Why:
 * The client needs to display "used/limit" per window, not just a boolean.
 * Exposing the raw counters means the UI does not have to make a second
 * request when it needs both the state and the numbers.
 */
export interface AiUsageSummary {
  isBlocked: boolean;
  blockReason: string | null;
  daily: { used: number; limit: number; resetAt: Date };
  weekly: { used: number; limit: number; resetAt: Date };
  monthly: { used: number; limit: number; resetAt: Date };
}

/**
 * Token usage reported by the provider after a completed stream.
 *
 * Why:
 * Kept as a plain shape rather than the AI SDK type so the repository and
 * service layers do not import from `ai` directly. Only the provider
 * boundary and the route touch the SDK.
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}
