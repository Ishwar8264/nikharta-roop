"use client";

import { Loader2, Send } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PublicationCardProps {
  title: string;
  description: ReactNode;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
  action?: {
    label: string;
    pendingLabel?: string;
    icon?: ReactNode;
    disabled?: boolean;
    onClick: () => Promise<void>;
  };
}

/** Reusable publication notice; the caller supplies its own API action and content. */
export function PublicationCard({ title, description, icon, className, children, action }: PublicationCardProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAction() {
    if (!action || busy || action.disabled) return;
    setError(null);
    setBusy(true);
    try {
      await action.onClick();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update publication. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={cn("rounded-xl border border-border bg-muted/30 p-4 sm:p-5", className)} aria-label={title} aria-busy={busy}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground" aria-hidden="true">{icon}</div> : null}
          <div className="min-w-0 space-y-1">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <div className="text-sm leading-relaxed text-muted-foreground">{description}</div>
          </div>
        </div>
        {action ? (
          <Button type="button" className="h-10 w-full shrink-0 gap-2 sm:w-auto" onClick={runAction} disabled={busy || action.disabled}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : action.icon ?? <Send className="size-4" aria-hidden="true" />}
            {busy ? action.pendingLabel ?? "Publishing…" : action.label}
          </Button>
        ) : null}
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
      {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
