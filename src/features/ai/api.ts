/**
 * Client-side API wrappers for the AI assistant feature.
 *
 * The chat-send path is streaming: the messages route returns a UI message
 * stream (`result.toUIMessageStreamResponse()`) that `useChat` from
 * `@ai-sdk/react` consumes directly. The wrappers here cover the non-streaming
 * CRUD routes; `chatMessagesEndpoint` + `csrfFetch` feed the streaming
 * transport used by the chat panel.
 *
 * Why a custom `csrfFetch` instead of the shared `api` client:
 * `useChat`'s transport calls `fetch` under the hood, bypassing
 * `backend.client`. Cookie-authenticated mutations (POST to the messages
 * route) need the `x-csrf-token` header, so we inject it here. We also reuse
 * the shared single-flight refresh on 401 so a mid-chat token expiry does not
 * strand the conversation.
 */

import { DefaultChatTransport, generateId, type UIMessage } from "ai";

import { api, refreshSession } from "@/lib/api/backend.client";

import type {
  AiContextType,
  PaginatedChats,
  PublicChat,
  PublicChatWithMessages,
} from "./types";

// ─── Route helpers ──────────────────────────────────────────────────────

const BASE = "/api/v1/ai";

/** Builds the messages (streaming send) endpoint for one chat. */
export function chatMessagesEndpoint(chatId: string): string {
  return `${BASE}/chats/${encodeURIComponent(chatId)}/messages`;
}

// ─── CSRF + refresh-aware fetch for the streaming transport ────────────

const CSRF_COOKIE = "csrfToken";
const CSRF_HEADER = "x-csrf-token";

/** Reads the double-submit CSRF token from the cookie jar. */
function readCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${CSRF_COOKIE}=([^;]+)`),
  );
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

/**
 * `fetch` wrapper that injects the CSRF header on every call and retries once
 * after a silent refresh when the access token has expired.
 *
 * Why retry on 401 only:
 * The streaming POST is the only AI request that bypasses `backend.client`.
 * Other 4xx/5xx statuses are surfaced to `useChat`'s `onError` / `error`
 * state — retrying them would risk duplicate assistant turns.
 */
export async function csrfFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  const csrf = readCsrfToken();
  if (csrf) headers.set(CSRF_HEADER, csrf);

  let res = await fetch(input, { ...init, headers, credentials: "include" });

  if (res.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      const retryHeaders = new Headers(init?.headers);
      const newCsrf = readCsrfToken();
      if (newCsrf) retryHeaders.set(CSRF_HEADER, newCsrf);
      res = await fetch(input, {
        ...init,
        headers: retryHeaders,
        credentials: "include",
      });
    }
  }

  return res;
}

// ─── Response envelopes ─────────────────────────────────────────────────

interface ChatListResponse {
  message: string;
  data: PublicChat[];
  meta: { nextCursor: string | null; hasMore: boolean };
}

interface ChatDetailResponse {
  message: string;
  data: PublicChatWithMessages;
}

interface ChatMutationResponse {
  message: string;
  data: { chat: PublicChat };
}

// ─── CRUD wrappers ──────────────────────────────────────────────────────

/** Lists the caller's chats (cursor-paginated). */
export async function listChatsApi(
  query: { cursor?: string; limit?: number } = {},
): Promise<PaginatedChats> {
  const params = new URLSearchParams();
  if (query.cursor) params.set("cursor", query.cursor);
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  const qs = params.toString();
  const res = await api.get<ChatListResponse>(
    `/ai/chats${qs ? `?${qs}` : ""}`,
  );
  return {
    items: res.data,
    nextCursor: res.meta.nextCursor,
    hasMore: res.meta.hasMore,
  };
}

/** Creates a new chat. Defaults to a `GENERAL` context when omitted. */
export async function createChatApi(
  input: { title?: string; contextType?: AiContextType; contextId?: string } = {},
): Promise<PublicChat> {
  const res = await api.post<ChatMutationResponse>("/ai/chats", input);
  return res.data.chat;
}

/** Loads one chat with its full message history. */
export async function getChatApi(chatId: string): Promise<PublicChatWithMessages> {
  const res = await api.get<ChatDetailResponse>(
    `/ai/chats/${encodeURIComponent(chatId)}`,
  );
  return res.data;
}

/** Deletes a chat and every message in it. */
export async function deleteChatApi(chatId: string): Promise<void> {
  await api.delete<{ message: string; data: null }>(
    `/ai/chats/${encodeURIComponent(chatId)}`,
  );
}

// ─── Streaming send (non-`useChat` convenience) ────────────────────────

/**
 * Sends a single user message and returns the full assistant reply text.
 *
 * Why this exists alongside `useChat`:
 * The chat panel uses `useChat` for the live streaming UX. This wrapper is the
 * non-interactive equivalent — useful for tests, programmatic sends, or a
 * future "quick question" widget. It consumes the same UI message stream the
 * panel consumes, but blocks until the stream closes and returns only the
 * concatenated text.
 *
 * Errors (quota exceeded, provider not configured, network) propagate as
 * thrown errors — callers should wrap in try/catch.
 */
export async function sendMessageApi(
  chatId: string,
  content: string,
  options: { signal?: AbortSignal } = {},
): Promise<string> {
  const transport = new DefaultChatTransport({
    api: chatMessagesEndpoint(chatId),
    credentials: "include",
    fetch: csrfFetch,
  });

  const userMessage: UIMessage = {
    id: generateId(),
    role: "user",
    parts: [{ type: "text", text: content, state: "done" }],
  };

  const chunkStream = await transport.sendMessages({
    trigger: "submit-message",
    chatId,
    messageId: undefined,
    messages: [userMessage],
    abortSignal: options.signal,
  });

  const reader = chunkStream.getReader();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value && value.type === "text-delta") text += value.delta;
  }
  return text;
}
