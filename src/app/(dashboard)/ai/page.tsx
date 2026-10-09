import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { ChatList, ChatPanel } from "@/features/ai";
import type {
  AiUsageSummary,
  PublicChat,
  PublicMessage,
} from "@/features/ai";
import { getSession } from "@/lib/auth/get-session";
import { cn } from "@/lib/utils";
import { AiChatNotFoundError } from "@/server/modules/ai/ai.errors";
import {
  getChat,
  getUsage,
  listChats,
} from "@/server/modules/ai/ai.service";

export const metadata: Metadata = {
  title: "AI assistant | Nikharta Roop",
};

/** Props for the page; `searchParams` is a Promise in Next 16. */
interface AiPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * AI assistant dashboard — usage summary, chat list, and the open conversation.
 *
 * Why one route for list + panel (`/ai?chat={id}`):
 * Sharing a route keeps the list + usage stats mounted while the panel swaps
 * underneath. Navigating between chats is a single searchParam change, so the
 * sidebar scroll position and quota cards persist across conversations.
 *
 * Why the chat is loaded server-side:
 * `getChat` is `server-only`. Rendering the first message batch on the server
 * gives the panel a hydrated starting point — no flash of empty conversation
 * before the client fetches history. The panel then streams new turns via
 * `useChat` against the messages endpoint.
 *
 * Why the layout collapses on mobile when a chat is open:
 * A phone has no room for a sidebar alongside a conversation. When `?chat=`
 * is present, the header / usage / list are hidden below `lg` and the panel
 * takes the full viewport; the panel's back button returns to `/ai`.
 */
export default async function AiAssistantPage({ searchParams }: AiPageProps) {
  const user = await getSession();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const chatParam = typeof sp.chat === "string" ? sp.chat : undefined;

  const [usage, chatsResult] = await Promise.all([
    getUsage(user.id),
    listChats(user.id, { limit: 50 }),
  ]);

  if (usage.isBlocked) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h1 className="font-heading text-2xl font-semibold">
              AI assistant paused
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {usage.blockReason ??
                "Your AI access has been paused. Please contact support."}
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const chats = chatsResult.items.map(toWireChat);
  const wireUsage = toWireUsage(usage);

  // Resolve the open chat, if any. A bad / stale id collapses to the
  // placeholder view instead of 500-ing the whole dashboard.
  let openChat: PublicChat | null = null;
  let openMessages: PublicMessage[] = [];
  let openError: string | null = null;
  if (chatParam) {
    try {
      const detail = await getChat(user.id, chatParam);
      openChat = toWireChat(detail.chat);
      openMessages = detail.messages.map(toWireMessage);
    } catch (error) {
      if (error instanceof AiChatNotFoundError) {
        openError = "That conversation could not be found.";
      } else {
        openError = "We couldn't open that conversation. Please try again.";
      }
    }
  }

  const windows = [
    { label: "Today", ...usage.daily },
    { label: "This week", ...usage.weekly },
    { label: "This month", ...usage.monthly },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className={cn(openChat && "hidden lg:block")}>
        <h1 className="font-heading text-3xl font-semibold">
          AI beauty assistant
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Personalised salon and service suggestions. Ask about bridal
          packages, skin care, or your next booking.
        </p>
      </header>

      <section
        className={cn(
          "grid gap-3 sm:grid-cols-3",
          openChat ? "mt-0 hidden lg:grid lg:mt-6" : "mt-6",
        )}
      >
        {windows.map((w) => {
          const pct =
            w.limit > 0 ? Math.min(100, Math.round((w.used / w.limit) * 100)) : 0;
          return (
            <Card key={w.label}>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">{w.label}</p>
                <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
                  {w.used}
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    / {w.limit}
                  </span>
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {Math.max(0, w.limit - w.used)} messages remaining
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section
        className={cn(
          "grid gap-6 lg:grid-cols-[320px_1fr]",
          openChat ? "mt-0 lg:mt-6" : "mt-6",
        )}
      >
        {/* Chat list — hidden on mobile once a chat is open */}
        <aside
          className={cn(
            "min-h-0",
            openChat && "hidden lg:block",
          )}
        >
          <ChatList chats={chats} activeChatId={openChat?.id} />
        </aside>

        {/* Chat region */}
        <div
          className={cn(
            "flex min-h-0 flex-col lg:h-[calc(100dvh-16rem)]",
            openChat ? "h-[calc(100dvh-4rem)]" : "min-h-[480px]",
          )}
        >
          {openChat ? (
            <ChatPanel
              key={openChat.id}
              chatId={openChat.id}
              initialMessages={openMessages}
              usage={wireUsage}
              title={openChat.title}
              contextType={openChat.contextType}
            />
          ) : (
            <Placeholder error={openError} />
          )}
        </div>
      </section>
    </main>
  );
}

/** Centered placeholder for the chat region when no conversation is open. */
function Placeholder({ error }: { error: string | null }) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-border bg-background">
        <Sparkles className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </span>
      <h2 className="mt-5 font-heading text-lg font-semibold tracking-tight">
        {error ? "Couldn't open that chat" : "Start a conversation"}
      </h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {error ??
          "Pick a recent chat from the list, or tap “New chat” to ask the AI assistant about salons, services, and packages."}
      </p>
    </div>
  );
}

// ─── Server → wire mappers (Date → ISO string) ──────────────────────────

function toWireChat(chat: {
  id: string;
  title: string | null;
  contextType: PublicChat["contextType"];
  contextId: string | null;
  createdAt: Date;
}): PublicChat {
  return {
    id: chat.id,
    title: chat.title,
    contextType: chat.contextType,
    contextId: chat.contextId,
    createdAt: chat.createdAt.toISOString(),
  };
}

function toWireMessage(message: {
  id: string;
  role: string;
  content: string;
  tokens: number;
  createdAt: Date;
}): PublicMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    tokens: message.tokens,
    createdAt: message.createdAt.toISOString(),
  };
}

function toWireUsage(usage: {
  isBlocked: boolean;
  blockReason: string | null;
  daily: { used: number; limit: number; resetAt: Date };
  weekly: { used: number; limit: number; resetAt: Date };
  monthly: { used: number; limit: number; resetAt: Date };
}): AiUsageSummary {
  return {
    isBlocked: usage.isBlocked,
    blockReason: usage.blockReason,
    daily: { ...usage.daily, resetAt: usage.daily.resetAt.toISOString() },
    weekly: { ...usage.weekly, resetAt: usage.weekly.resetAt.toISOString() },
    monthly: { ...usage.monthly, resetAt: usage.monthly.resetAt.toISOString() },
  };
}
