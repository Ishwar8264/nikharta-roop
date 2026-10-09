"use client";

import { Monitor, Smartphone, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/backend.client";
import { cn } from "@/lib/utils";

import { revokeSessionApi } from "./api";
import type { AuthSessionWire } from "./types";

interface SessionsPanelProps {
  initial: AuthSessionWire[];
}

/**
 * Picks a recognizable device icon from the user-agent string.
 *
 * Why a heuristic instead of parsing UA: parsing libraries are heavy and the
 * signal we need is binary — phone vs not-phone. A case-insensitive substring
 * check is good enough for an icon hint; the session row also shows the raw
 * UA so the user can disambiguate.
 */
function pickDeviceIcon(userAgent: string | null) {
  if (!userAgent) return Monitor;
  const ua = userAgent.toLowerCase();
  if (
    ua.includes("mobi") ||
    ua.includes("android") ||
    ua.includes("iphone") ||
    ua.includes("ipad")
  ) {
    return Smartphone;
  }
  return Monitor;
}

/** Formats an ISO string as a short, locale-aware date + time. */
function formatSessionDate(iso: string): string {
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
 * Sessions list with revoke buttons.
 *
 * Why local state + `router.refresh()` instead of mutation-only:
 * Revoking the cookie-backed session invalidates the browser's access
 * cookie. The next call to `getSession()` (which fires on the next page
 * navigation) would return null and the dashboard layout would redirect to
 * `/login`. We mirror that behaviour here: when `wasCurrent` is true, force
 * a navigation to `/login` so the user ends up at the right place instead of
 * staring at a stale session list. For other sessions, we `router.refresh()`
 * so the server re-renders with the post-revoke list.
 */
export function SessionsPanel({ initial }: SessionsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  async function handleRevoke(session: AuthSessionWire) {
    setRevokingId(session.id);
    try {
      await revokeSessionApi(session.id);
      if (session.isCurrent) {
        toast.success("This device has been signed out.");
        // The DELETE response cleared the session cookies, so navigating to
        // /login will land on a fresh signed-out state.
        setTimeout(() => {
          window.location.assign(routes.login);
        }, 500);
        return;
      }
      toast.success("Session revoked.");
      startTransition(() => router.refresh());
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Could not revoke that session. Please try again.");
      }
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active sessions</CardTitle>
        <CardDescription>
          Devices currently signed into your account. Revoke any you do not
          recognize.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {initial.length === 0 ? (
          <EmptyState
            icon={Monitor}
            title="No active sessions"
            description="You are not signed in on any device right now."
          />
        ) : (
          <ul className="divide-y divide-border">
            {initial.map((session) => {
              const Icon = pickDeviceIcon(session.userAgent);
              const busy = isPending && revokingId === session.id;
              return (
                <li
                  key={session.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                      aria-hidden="true"
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {session.userAgent ?? "Unknown device"}
                        {session.isCurrent ? (
                          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            This device
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.ipAddress ?? "Unknown IP"} · signed in{" "}
                        {formatSessionDate(session.createdAt)} · expires{" "}
                        {formatSessionDate(session.expiresAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevoke(session)}
                    disabled={busy}
                    className={cn(
                      session.isCurrent ? "text-destructive" : null,
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {session.isCurrent ? "Sign out" : "Revoke"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
