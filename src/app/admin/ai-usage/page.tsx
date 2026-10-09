import type { Metadata } from "next";
import { Ban, MessageSquare, Sparkles, Users as UsersIcon } from "lucide-react";

import { Pagination } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/auth/get-session";
import { isResourceId } from "@/server/modules/salon/salon.helpers";
import {
  getAdminAiUsageStats,
  listAdminAiUsageLogs,
  listAdminUsers,
} from "@/server/modules/admin/admin.service";
import { routes } from "@/config/routes";

export const metadata: Metadata = {
  title: "AI usage | Admin",
  description: "Platform AI usage — cost, volume, and per-user activity.",
  robots: { index: false, follow: false },
};

/** Indian-English short date+time — keeps the audit-friendly "12 Mar 2026, 4:30 PM" form. */
const timestampFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

interface PageProps {
  searchParams: Promise<{ cursor?: string }>;
}

/**
 * Admin AI usage dashboard.
 *
 * Why three service calls in parallel:
 *   1. `getAdminAiUsageStats({ groupBy: "user" })` — powers the four stat cards
 *      and identifies the top user by total tokens.
 *   2. `listAdminAiUsageLogs({ limit, cursor })` — the paginated raw-log table.
 *   3. `listAdminUsers({ limit: 100 })` — counts blocked users. There is no
 *      dedicated "count blocked" endpoint, so this fetches the first page and
 *      filters server-side. A future endpoint can replace this; the card stays.
 *
 * Why the table shows raw logs and not per-user aggregates:
 * The aggregations live on the stats endpoint and are already surfaced as the
 * cards above. The table's job is the "who did what, when" drill-down — raw
 * rows with a "load more" cursor is the right shape for that question.
 */
export default async function AdminAiUsagePage({ searchParams }: PageProps) {
  const user = await getSession();
  if (!user || user.role !== "SUPER_ADMIN") return null;

  const search = await searchParams;
  const cursor =
    search.cursor && isResourceId(search.cursor) ? search.cursor : undefined;

  const [statsResult, logsResult, usersResult] = await Promise.all([
    getAdminAiUsageStats(user.role, { groupBy: "user" }),
    listAdminAiUsageLogs(user.role, { limit: 50, cursor }),
    listAdminUsers(user.role, { limit: 100 }),
  ]);

  const totalMessages = statsResult.rows.reduce(
    (sum, row) => sum + row.requestCount,
    0,
  );
  const totalAiUsers = statsResult.rows.length;
  const blockedUsers = usersResult.items.filter(
    (u) => u.aiUsage?.isBlocked === true,
  ).length;
  const topRow = statsResult.rows.slice().sort((a, b) => b.totalTokens - a.totalTokens)[0];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-semibold">AI usage</h1>
        <p className="mt-2 text-muted-foreground">
          Platform-wide AI activity — cost, volume, and the most recent messages.
        </p>
      </header>

      <section
        aria-label="AI usage summary"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          icon={UsersIcon}
          label="AI users"
          value={String(totalAiUsers)}
          subtext="Distinct users with AI activity"
        />
        <StatCard
          icon={MessageSquare}
          label="Total messages"
          value={totalMessages.toLocaleString("en-IN")}
          subtext="Across all models"
        />
        <StatCard
          icon={Ban}
          label="Blocked users"
          value={String(blockedUsers)}
          subtext="AI access revoked"
        />
        <StatCard
          icon={Sparkles}
          label="Top consumer"
          value={topRow ? formatUserId(topRow.key) : "—"}
          subtext={
            topRow
              ? `${topRow.totalTokens.toLocaleString("en-IN")} tokens`
              : "No usage yet"
          }
        />
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold">Recent activity</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Latest AI requests across the platform.
        </p>

        {logsResult.items.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border/60 bg-muted/20 px-6 py-16 text-center">
            <p className="font-medium">No AI activity yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              AI usage logs will appear here once customers start chatting.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <ul className="mt-4 space-y-3 lg:hidden">
              {logsResult.items.map((log) => (
                <li
                  key={log.id}
                  className="space-y-1.5 rounded-xl border border-border bg-card p-4 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatUserId(log.userId)}
                    </span>
                    <Badge variant="outline">{log.model}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {timestampFormatter.format(log.createdAt)}
                  </p>
                  <p className="font-mono text-xs">
                    {log.totalTokens.toLocaleString("en-IN")} tokens
                    {log.costUsd != null
                      ? ` · $${log.costUsd.toFixed(4)}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className="mt-4 hidden overflow-x-auto rounded-xl border lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Model</th>
                    <th className="px-4 py-3 font-medium">Context</th>
                    <th className="px-4 py-3 text-right font-medium">Tokens (in/out/total)</th>
                    <th className="px-4 py-3 text-right font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logsResult.items.map((log) => (
                    <tr key={log.id} className="bg-card">
                      <td className="px-4 py-3 text-muted-foreground">
                        <time dateTime={log.createdAt.toISOString()}>
                          {timestampFormatter.format(log.createdAt)}
                        </time>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {formatUserId(log.userId)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{log.model}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {log.contextType}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {log.inputTokens.toLocaleString("en-IN")} /{" "}
                        {log.outputTokens.toLocaleString("en-IN")} /{" "}
                        {log.totalTokens.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                        {log.costUsd != null
                          ? `$${log.costUsd.toFixed(4)}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              hasMore={logsResult.hasMore}
              nextCursor={logsResult.nextCursor}
              buildHref={(next) => `${routes.adminAiUsage}?cursor=${next}`}
            />
          </>
        )}
      </section>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtext: string;
}

function StatCard({ icon: Icon, label, value, subtext }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className="font-heading text-2xl font-semibold text-foreground">
          {value}
        </p>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{subtext}</p>
      </CardContent>
    </Card>
  );
}

/** Truncates a user id to its last 6 chars for a compact, readable cell. */
function formatUserId(userId: string): string {
  return userId.length > 8 ? `…${userId.slice(-6)}` : userId;
}
