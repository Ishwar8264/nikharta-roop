import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/auth/get-session";
import { getUsage, listChats } from "@/server/modules/ai/ai.service";

export const metadata: Metadata = {
  title: "AI assistant | Nikharta Roop",
};

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** AI assistant landing — usage summary + chat list. */
export default async function AiAssistantPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [usage, chats] = await Promise.all([
    getUsage(user.id),
    listChats(user.id, { limit: 20 }),
  ]);

  if (usage.isBlocked) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h1 className="font-heading text-2xl font-semibold">AI assistant paused</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {usage.blockReason ?? "Your AI access has been paused. Please contact support."}
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const windows = [
    { label: "Today", ...usage.daily },
    { label: "This week", ...usage.weekly },
    { label: "This month", ...usage.monthly },
  ];

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
      <header>
        <h1 className="font-heading text-3xl font-semibold">AI beauty assistant</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Personalised salon and service suggestions. Ask about bridal packages, skin care, or your next booking.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        {windows.map((w) => {
          const pct = w.limit > 0 ? Math.min(100, Math.round((w.used / w.limit) * 100)) : 0;
          return (
            <Card key={w.label}>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground">{w.label}</p>
                <p className="mt-1 font-heading text-2xl font-semibold tabular-nums">
                  {w.used}
                  <span className="text-base font-normal text-muted-foreground"> / {w.limit}</span>
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {w.limit - w.used} messages remaining
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-semibold">Recent chats</h2>
          <Button>New chat</Button>
        </div>
        {chats.items.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No conversations yet. Start a new chat to get personalised suggestions.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {chats.items.map((chat) => (
              <li key={chat.id} className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{chat.title ?? "Untitled chat"}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline">{chat.contextType.replace(/_/g, " ").toLowerCase()}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {dateFormatter.format(new Date(chat.createdAt))}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm">Open</Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
