import "server-only";

import type { AiContextType } from "@/generated/prisma/client";

import type { PublicChat, PublicMessage } from "./ai.types";

interface ChatRow {
  id: string;
  title: string | null;
  contextType: AiContextType;
  contextId: string | null;
  createdAt: Date;
}

interface MessageRow {
  id: string;
  role: string;
  content: string;
  tokens: number;
  createdAt: Date;
}

/**
 * Passthrough — the repository select already matches the public shape.
 *
 * Why:
 * Kept as a named function rather than re-exporting the raw row so future
 * changes (renaming a field, filtering internal flags) land here instead of
 * leaking into every route that reads a chat.
 */
export function toPublicChat(row: ChatRow): PublicChat {
  return {
    id: row.id,
    title: row.title,
    contextType: row.contextType,
    contextId: row.contextId,
    createdAt: row.createdAt,
  };
}

/** Passthrough for messages. */
export function toPublicMessage(row: MessageRow): PublicMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    tokens: row.tokens,
    createdAt: row.createdAt,
  };
}
