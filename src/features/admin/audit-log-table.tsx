"use client";

import { ChevronDown, ChevronRight, History } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { PublicAuditLog } from "./types";

interface AuditLogTableProps {
  logs: PublicAuditLog[];
}

const actionBadgeVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  CREATE: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
};

/**
 * Audit log viewer with click-to-expand rows.
 *
 * Why one client island for the whole table:
 * The expand interaction is pure client state — no mutation, no fetch. Rendering
 * the rows server-side and shipping a tiny per-row toggle would mean N client
 * boundaries; collapsing them into one table keeps the JS cost at one island
 * per page while preserving the "click a row to see the diff" affordance.
 */
export function AuditLogTable({ logs }: AuditLogTableProps) {
  if (logs.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No audit entries"
        description="Audit log entries will appear here as platform actions are recorded."
      />
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Mobile cards */}
      <ul className="space-y-3 lg:hidden">
        {logs.map((log) => (
          <AuditLogCard key={log.id} log={log} />
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-muted-foreground">
              <th className="w-8 px-2 py-3" aria-label="Expand" />
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Entity</th>
              <th className="px-4 py-3 font-medium">Entity id</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((log) => (
              <AuditLogRow key={log.id} log={log} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditLogCard({ log }: { log: PublicAuditLog }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <span className="mt-0.5 text-muted-foreground" aria-hidden="true">
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={actionBadgeVariant[log.action] ?? "outline"}>
              {log.action}
            </Badge>
            <span className="font-medium">{log.entity}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            <time dateTime={log.createdAt}>
              {formatTimestamp(log.createdAt)}
            </time>
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            actor: {log.userId ?? "system"} · entity id:{" "}
            {log.entityId ?? "—"}
          </p>
        </div>
      </button>
      {open ? <AuditLogDetails log={log} /> : null}
    </li>
  );
}

function AuditLogRow({ log }: { log: PublicAuditLog }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="bg-card">
        <td className="px-2 py-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Collapse details" : "Expand details"}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {open ? (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </td>
        <td className="px-4 py-3 text-muted-foreground">
          <time dateTime={log.createdAt}>{formatTimestamp(log.createdAt)}</time>
        </td>
        <td className="px-4 py-3 font-mono text-xs">
          {log.userId ?? "system"}
        </td>
        <td className="px-4 py-3">
          <Badge variant={actionBadgeVariant[log.action] ?? "outline"}>
            {log.action}
          </Badge>
        </td>
        <td className="px-4 py-3">{log.entity}</td>
        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
          {log.entityId ?? "—"}
        </td>
      </tr>
      {open ? (
        <tr className="bg-muted/30">
          <td colSpan={6} className="px-4 pb-4">
            <AuditLogDetails log={log} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

/** Renders the JSON diff + metadata for one audit entry. */
function AuditLogDetails({ log }: { log: PublicAuditLog }) {
  return (
    <div className={cn("space-y-3 pt-3")}>
      <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="font-medium text-muted-foreground">IP address</dt>
          <dd className="font-mono">{log.ipAddress ?? "—"}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">User agent</dt>
          <dd className="break-all font-mono">{log.userAgent ?? "—"}</dd>
        </div>
      </dl>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Old state</p>
          <pre className="mt-1 max-h-64 overflow-auto rounded-lg border border-border bg-background p-3 text-xs">
            {log.oldData ? JSON.stringify(log.oldData, null, 2) : "—"}
          </pre>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">New state</p>
          <pre className="mt-1 max-h-64 overflow-auto rounded-lg border border-border bg-background p-3 text-xs">
            {log.newData ? JSON.stringify(log.newData, null, 2) : "—"}
          </pre>
        </div>
      </div>
    </div>
  );
}

const timestampFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function formatTimestamp(iso: string): string {
  return timestampFormatter.format(new Date(iso));
}
