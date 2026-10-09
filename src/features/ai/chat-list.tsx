"use client";

import { MessageSquare, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/backend.client";
import { cn } from "@/lib/utils";

import { createChatApi } from "./api";
import type { AiContextType, PublicChat } from "./types";

interface ChatListProps {
  /** Server-loaded chats for the initial render. */
  chats: PublicChat[];
  /** The currently open chat id, used to highlight the active row. */
  activeChatId?: string;
}

const CONTEXT_LABELS: Record<AiContextType, string> = {
  GENERAL: "general",
  STAFF: "staff",
  PRODUCT: "product",
  SERVICE: "service",
};

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/**
 * Sidebar list of AI chats with a "new chat" action.
 *
 * Why a Client Component:
 * The "New chat" button triggers a mutation + navigation. The list rows are
 * plain `<Link>`s, so they remain crawlable and work without JS; only the
 * create action needs client interactivity.
 */
export function ChatList({ chats, activeChatId }: ChatListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);

  function handleNewChat() {
    if (creating || isPending) return;
    setCreating(true);
    startTransition(async () => {
      try {
        const chat = await createChatApi({ contextType: "GENERAL" });
        router.push(routes.aiChat(chat.id));
      } catch (error) {
        toast.error(
          error instanceof ApiError ? error.message : "Couldn't start a new chat.",
        );
      } finally {
        setCreating(false);
      }
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-1 pb-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Chats
        </h2>
        <Button
          size="sm"
          onClick={handleNewChat}
          disabled={creating || isPending}
        >
          <Plus className="size-3.5" />
          New chat
        </Button>
      </div>

      {chats.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description="Start a new chat to get personalised salon and service suggestions."
          className="mt-4 py-10"
        />
      ) : (
        <nav className="flex-1 min-h-0 overflow-y-auto">
          <ul className="space-y-1">
            {chats.map((chat) => (
              <li key={chat.id}>
                <ChatRow
                  chat={chat}
                  active={chat.id === activeChatId}
                />
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

/** One chat row — a link styled as a list item with an active state. */
function ChatRow({ chat, active }: { chat: PublicChat; active: boolean }) {
  return (
    <Link
      href={routes.aiChat(chat.id)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "block rounded-lg border border-transparent px-3 py-2.5 transition-colors",
        active
          ? "border-border bg-muted/60"
          : "hover:bg-muted/40",
      )}
    >
      <p className="truncate text-sm font-medium">
        {chat.title?.trim() || "Untitled chat"}
      </p>
      <div className="mt-1 flex items-center gap-2">
        <Badge variant="outline" className="text-[10px]">
          {CONTEXT_LABELS[chat.contextType] ?? chat.contextType.toLowerCase()}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {dateFormatter.format(new Date(chat.createdAt))}
        </span>
      </div>
    </Link>
  );
}
