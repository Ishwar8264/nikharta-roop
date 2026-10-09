import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NotificationInbox } from "@/features/notification/notification-inbox";
import { getSession } from "@/lib/auth/get-session";
import { listNotifications, getUnreadCount } from "@/server/modules/notification/notification.service";

export const metadata: Metadata = {
  title: "Notifications | Nikharta Roop",
};

/** Customer notification inbox. */
export default async function NotificationsPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [result, unreadCount] = await Promise.all([
    listNotifications(user.id, { limit: 50 }),
    getUnreadCount(user.id),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="font-heading text-3xl font-semibold">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Booking reminders, offers, and account updates.
        </p>
      </header>
      <NotificationInbox
        initial={result.items.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          channel: n.channel,
          status: n.status,
          data: n.data as Record<string, unknown> | null,
          readAt: n.readAt ? n.readAt.toISOString() : null,
          sentAt: n.sentAt ? n.sentAt.toISOString() : null,
          createdAt: n.createdAt.toISOString(),
        }))}
        initialUnreadCount={unreadCount}
        hasMore={result.hasMore}
        nextCursor={result.nextCursor}
      />
    </main>
  );
}
