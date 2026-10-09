"use client";

import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Loader2,
  Mail,
  MessageSquare,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ApiError } from "@/lib/api/backend.client";
import { cn } from "@/lib/utils";

import {
  deleteNotificationApi,
  listNotificationsApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from "./api";
import type {
  NotificationChannel,
  PublicNotificationWire,
} from "./types";

interface NotificationInboxProps {
  initial: PublicNotificationWire[];
  initialUnreadCount: number;
  hasMore: boolean;
  nextCursor: string | null;
}

/**
 * Picks an icon for the notification based on its channel + payload type.
 *
 * Why a switch on `data.type` first:
 * Notification templates stamp a `type` discriminator (e.g.
 * `appointment.confirmed`, `loyalty.earned`) into the data block. The
 * channel is the transport, not the meaning — a `loyalty.earned` notice
 * delivered over `IN_APP` should look different from a `review.request`
 * over the same channel.
 */
function pickIcon(notification: PublicNotificationWire) {
  const type = notification.data?.type;
  if (typeof type === "string") {
    if (type.startsWith("loyalty")) return CheckCircle2;
    if (type.startsWith("appointment")) return Bell;
    if (type.startsWith("review")) return MessageSquare;
  }
  switch (notification.channel) {
    case "EMAIL":
      return Mail;
    case "SMS":
    case "WHATSAPP":
      return Smartphone;
    default:
      return Bell;
  }
}

/** Formats an ISO string as a short, locale-aware relative-ish timestamp. */
function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

/**
 * Notifications inbox with mark-read and delete actions.
 *
 * Why local state instead of relying on `router.refresh()`:
 * Marking a notification read should feel instant. We update local state
 * immediately, then fire the PATCH; if it fails we roll back and toast. The
 * "Mark all read" button does the same for the whole list. The server is
 * still the source of truth — `router.refresh()` after a successful action
 * re-pulls the canonical list.
 */
export function NotificationInbox({
  initial,
  initialUnreadCount,
  hasMore: initialHasMore,
  nextCursor: initialNextCursor,
}: NotificationInboxProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<PublicNotificationWire[]>(initial);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialNextCursor,
  );
  const [loadingMore, setLoadingMore] = useState(false);

  function refreshServer() {
    startTransition(() => router.refresh());
  }

  async function handleMarkRead(notification: PublicNotificationWire) {
    if (notification.status === "READ") return;
    setBusyId(notification.id);
    const previous = items;
    setItems((current) =>
      current.map((item) =>
        item.id === notification.id
          ? { ...item, status: "READ", readAt: new Date().toISOString() }
          : item,
      ),
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await markNotificationReadApi(notification.id);
      refreshServer();
    } catch (error) {
      setItems(previous);
      setUnreadCount(initialUnreadCount);
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Could not mark that notification. Please try again.");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    const previous = items;
    const previousCount = unreadCount;
    const now = new Date().toISOString();
    setItems((current) =>
      current.map((item) =>
        item.status === "READ"
          ? item
          : { ...item, status: "READ", readAt: now },
      ),
    );
    setUnreadCount(0);
    try {
      await markAllNotificationsReadApi();
      toast.success("All notifications marked read.");
      refreshServer();
    } catch (error) {
      setItems(previous);
      setUnreadCount(previousCount);
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Could not mark all notifications. Please try again.");
      }
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleDelete(notification: PublicNotificationWire) {
    setBusyId(notification.id);
    const previous = items;
    const wasUnread = notification.status !== "READ";
    setItems((current) => current.filter((item) => item.id !== notification.id));
    if (wasUnread) setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await deleteNotificationApi(notification.id);
      refreshServer();
    } catch (error) {
      setItems(previous);
      if (wasUnread) setUnreadCount((count) => count + 1);
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Could not delete that notification. Please try again.");
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleLoadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const { markNotificationReadApi: _omit, ...rest } = await import(
        "./api"
      );
      void _omit;
      const response = await rest.listNotificationsApi({
        cursor: nextCursor,
        limit: 20,
      });
      setItems((current) => [...current, ...response.data]);
      setNextCursor(response.meta.nextCursor);
      setHasMore(response.meta.hasMore);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Could not load more notifications.");
      }
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <span>Inbox</span>
            {unreadCount > 0 ? (
              <Badge variant="default">{unreadCount} unread</Badge>
            ) : null}
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAll || unreadCount === 0 || isPending}
          >
            {markingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Mark all read
          </Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description="Booking confirmations, loyalty updates, and review requests will show up here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {items.map((notification) => {
                const Icon = pickIcon(notification);
                const isUnread = notification.status !== "READ";
                const busy = busyId === notification.id;
                return (
                  <li
                    key={notification.id}
                    className={cn(
                      "flex flex-wrap items-start gap-3 py-4",
                      isUnread && "bg-primary/5",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleMarkRead(notification)}
                      disabled={busy || !isUnread}
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        isUnread
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                        !isUnread && "cursor-default",
                      )}
                      aria-label={
                        isUnread ? "Mark as read" : "Already read"
                      }
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-foreground">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(notification.createdAt)}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {notification.body}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(notification)}
                      disabled={busy}
                      aria-label="Delete notification"
                    >
                      {busy ? (
                        <Loader2
                          className="h-3.5 w-3.5 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          {hasMore ? (
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : null}
                Load more
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

// Type-only re-export so callers that need it (and the channel enum) can
// reach it through this module without a second import line.
export type { NotificationChannel };
