"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  ArrowLeft,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { chatMessagesEndpoint, csrfFetch } from "./api";
import { isUsageExhausted, type AiUsageSummary, type PublicMessage } from "./types";

interface ChatPanelProps {
  chatId: string;
  /** Server-rendered message history, converted to `UIMessage[]` on mount. */
  initialMessages: PublicMessage[];
  /** Quota summary — disables the composer when exhausted or blocked. */
  usage: AiUsageSummary;
  /** Optional chat title for the header. */
  title?: string | null;
  /** Context badge label (e.g. "general", "staff"). */
  contextType?: string;
}

const CONTEXT_LABELS: Record<string, string> = {
  GENERAL: "general",
  STAFF: "staff",
  PRODUCT: "product",
  SERVICE: "service",
};

/** Starter prompts shown in an empty conversation. */
const SUGGESTIONS = [
  "Suggest a bridal package for oily skin",
  "What services suit a pre-wedding glow?",
  "Help me pick a hairstyle for an engagement",
];

/**
 * Converts the persisted message shape into the `UIMessage[]` the AI SDK's
 * `useChat` hook seeds from. Each message becomes a single "done" text part so
 * the hook treats history as fully rendered (no streaming cursor on old turns).
 */
function toUIMessages(messages: PublicMessage[]): UIMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role === "assistant" ? "assistant" : "user",
    parts: [{ type: "text", text: m.content, state: "done" as const }],
  }));
}

/** Concatenates the text parts of a `UIMessage` into a single string. */
function messageText(message: UIMessage): string {
  return message.parts
    .filter(
      (p): p is { type: "text"; text: string } =>
        typeof p === "object" && p !== null && "type" in p && p.type === "text",
    )
    .map((p) => p.text)
    .join("");
}

/** AI chat conversation panel — streaming send/receive via `useChat`. */
export function ChatPanel({
  chatId,
  initialMessages,
  usage,
  title,
  contextType,
}: ChatPanelProps) {
  const seedMessages = useMemo(() => toUIMessages(initialMessages), [initialMessages]);

  // The transport is built once per chat. `useChat` owns message state after
  // init, so the `messages` option is only read on first render — remounting
  // the panel (via `key={chatId}` in the page) is what swaps conversations.
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: chatMessagesEndpoint(chatId),
        credentials: "include",
        fetch: csrfFetch,
      }),
    [chatId],
  );

  const { messages, sendMessage, status, stop, regenerate, error } = useChat({
    id: chatId,
    messages: seedMessages,
    transport,
  });

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const isStreaming = status === "streaming" || status === "submitted";
  const exhausted = isUsageExhausted(usage);
  const inputDisabled = exhausted || isStreaming;

  // Signature that changes whenever the visible bottom of the thread moves —
  // new message, longer streaming text, or a status flip. Used as the effect
  // dep so we scroll exactly when the viewport would otherwise lag.
  const bottomSignature = useMemo(() => {
    const last = messages[messages.length - 1];
    const lastText = last ? messageText(last).length : 0;
    return `${messages.length}:${last?.id ?? ""}:${lastText}:${status}`;
  }, [messages, status]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [bottomSignature]);

  function send() {
    const trimmed = input.trim();
    if (!trimmed || inputDisabled) return;
    setInput("");
    // Fire-and-forget: the hook appends the user message optimistically and
    // surfaces failures through `error`. Not awaiting keeps the UI responsive.
    void sendMessage({ text: trimmed });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    send();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter inserts a newline. IME composition (Enter to
    // confirm a candidate) must not send — `isComposing` guards that.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  }

  const lastMessage = messages[messages.length - 1];
  const showTypingIndicator =
    isStreaming &&
    (!lastMessage || lastMessage.role !== "assistant" || messageText(lastMessage) === "");

  return (
    <section className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          render={<Link href="/ai" aria-label="Back to chats" />}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <Avatar size="sm">
          <AvatarFallback className="bg-primary/10 text-primary">
            <Sparkles className="size-3.5" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {title?.trim() || "New conversation"}
          </p>
          <p className="text-xs text-muted-foreground">
            AI beauty assistant
            {contextType ? (
              <Badge variant="outline" className="ml-2 align-middle">
                {CONTEXT_LABELS[contextType] ?? contextType.toLowerCase()}
              </Badge>
            ) : null}
          </p>
        </div>
      </header>

      {/* Messages */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-4 py-6"
        aria-live="polite"
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.length === 0 && !isStreaming ? (
            <EmptyConversation onPick={(s) => sendMessage({ text: s })} disabled={exhausted} />
          ) : null}

          {messages.map((message, index) => {
            const isLast = index === messages.length - 1;
            return (
              <MessageBubble
                key={message.id}
                message={message}
                streaming={isLast && isStreaming && message.role === "assistant"}
              />
            );
          })}

          {showTypingIndicator ? <TypingBubble /> : null}

          <div ref={bottomRef} className="h-px" />
        </div>
      </div>

      {/* Composer */}
      <footer className="border-t px-4 py-3">
        {error ? (
          <div className="mx-auto mb-2 max-w-2xl rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error.message || "Something went wrong. Please try again."}
          </div>
        ) : null}

        {exhausted ? (
          <div className="mx-auto max-w-2xl rounded-lg border bg-muted/40 px-3 py-2 text-center text-xs text-muted-foreground">
            {usage.isBlocked
              ? usage.blockReason ?? "AI access is paused."
              : "You've reached your message quota. It resets on the next cycle."}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about packages, services, or your next booking…"
            disabled={inputDisabled}
            rows={1}
            className="max-h-40 resize-none"
            aria-label="Message"
          />
          {isStreaming ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void stop()}
              aria-label="Stop generating"
            >
              <Square className="size-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={inputDisabled || input.trim().length === 0}
              aria-label="Send message"
            >
              <Send className="size-4" />
            </Button>
          )}
          {messages.length > 0 && !isStreaming && lastMessage?.role === "assistant" ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => void regenerate()}
              aria-label="Regenerate last response"
              disabled={exhausted}
            >
              <RefreshCw className="size-4" />
            </Button>
          ) : null}
        </form>
      </footer>
    </section>
  );
}

/** One chat bubble — right-aligned for the user, left for the assistant. */
function MessageBubble({
  message,
  streaming,
}: {
  message: UIMessage;
  streaming: boolean;
}) {
  const isUser = message.role === "user";
  const text = messageText(message);

  return (
    <div
      className={cn(
        "flex items-start gap-2.5",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <Avatar size="sm" className="mt-0.5 shrink-0">
        <AvatarFallback
          className={cn(
            isUser ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
          )}
        >
          {isUser ? <UserIcon className="size-3.5" /> : <Sparkles className="size-3.5" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words",
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-muted text-foreground",
        )}
      >
        {text}
        {streaming ? (
          <span
            className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-current align-middle"
            aria-hidden="true"
          />
        ) : null}
      </div>
    </div>
  );
}

/** Animated "assistant is typing" bubble shown before the first token. */
function TypingBubble() {
  return (
    <div className="flex items-start gap-2.5">
      <Avatar size="sm" className="mt-0.5 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary">
          <Sparkles className="size-3.5" />
        </AvatarFallback>
      </Avatar>
      <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
        <div className="flex gap-1" aria-label="Assistant is typing">
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
        </div>
      </div>
    </div>
  );
}

/** Empty-conversation prompt with clickable starter suggestions. */
function EmptyConversation({
  onPick,
  disabled,
}: {
  onPick: (suggestion: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <Avatar size="lg">
        <AvatarFallback className="bg-primary/10 text-primary">
          <Sparkles className="size-5" />
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="font-heading text-lg font-semibold">How can I help you today?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask about bridal packages, skincare routines, or your next appointment.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={disabled}
            onClick={() => onPick(suggestion)}
            className="rounded-xl border bg-card px-4 py-3 text-left text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
