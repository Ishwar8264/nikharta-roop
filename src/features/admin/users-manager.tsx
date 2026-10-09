"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Ban,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users as UsersIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { EmptyState } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/features/auth/shared/components/field";
import { FormError } from "@/features/auth/shared/components/form-error";
import { ApiError } from "@/lib/api/backend.client";

import {
  changeUserRoleApi,
  setUserAiBlockApi,
  setUserAiQuotaApi,
} from "./api";
import type { AdminUserView } from "./types";

interface UsersManagerProps {
  users: AdminUserView[];
}

const roleBadgeVariant: Record<AdminUserView["role"], "secondary" | "default"> =
  {
    USER: "secondary",
    SUPER_ADMIN: "default",
  };

/**
 * Admin user management table.
 *
 * Why a single client island for the whole list:
 * Each row owns three independent mutations (role, AI block, AI quota). Pulling
 * them into one client component lets `router.refresh()` after every mutation
 * re-render the whole table from the server's source of truth, so optimistic
 * UI never drifts from the persisted state.
 *
 * Why the mutations are optimistic + toast + rollback:
 * Toggling a switch and seeing it flip back on error is the worst-feeling UI
 * pattern. We apply the change immediately, fire the request, and only revert
 * on failure — the toast confirms the outcome.
 */
export function UsersManager({ users }: UsersManagerProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function refresh() {
    startTransition(() => router.refresh());
  }

  if (users.length === 0) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="No users found"
        description="No platform users match the current view. New signups will appear here automatically."
      />
    );
  }

  return (
    <div className="mt-8 space-y-3">
      {/* Mobile cards */}
      <ul className="space-y-3 lg:hidden">
        {users.map((user) => (
          <li
            key={user.id}
            className="space-y-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {user.name ?? "Unnamed user"}
                </p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {user.email ?? user.phone ?? user.id}
                </p>
              </div>
              <Badge variant={roleBadgeVariant[user.role]}>
                {user.role === "SUPER_ADMIN" ? "Admin" : "User"}
              </Badge>
            </div>
            <UserRowActions user={user} onSaved={refresh} />
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">AI quota (D / W / M)</th>
              <th className="px-4 py-3 font-medium">AI status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="bg-card">
                <td className="px-4 py-3">
                  <p className="font-medium">
                    {user.name ?? "Unnamed user"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.email ?? user.phone ?? user.id}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={roleBadgeVariant[user.role]}>
                    {user.role === "SUPER_ADMIN" ? "Admin" : "User"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.aiUsage ? (
                    <span className="font-mono text-xs">
                      {user.aiUsage.dailyUsed}/{user.aiUsage.dailyLimit} ·{" "}
                      {user.aiUsage.weeklyUsed}/{user.aiUsage.weeklyLimit} ·{" "}
                      {user.aiUsage.monthlyUsed}/{user.aiUsage.monthlyLimit}
                    </span>
                  ) : (
                    <span className="text-xs">No AI access yet</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {user.aiUsage?.isBlocked ? (
                    <Badge variant="destructive">
                      <Ban aria-hidden="true" data-icon="inline-start" />
                      Blocked
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <CheckCircle2
                        aria-hidden="true"
                        data-icon="inline-start"
                      />
                      Active
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <UserRowActions user={user} onSaved={refresh} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface UserRowActionsProps {
  user: AdminUserView;
  onSaved: () => void;
}

/** All three mutations for one user — role select, AI toggle, quota dialog. */
function UserRowActions({ user, onSaved }: UserRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [blockOpen, setBlockOpen] = useState(false);
  const [quotaOpen, setQuotaOpen] = useState(false);

  async function handleRoleChange(next: "USER" | "SUPER_ADMIN") {
    if (next === user.role) return;
    try {
      await changeUserRoleApi(user.id, { role: next });
      toast.success(
        next === "SUPER_ADMIN"
          ? `${user.name ?? "User"} promoted to admin.`
          : `${user.name ?? "User"} demoted to user.`,
      );
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not change the role. Please try again.",
      );
    }
  }

  async function handleBlockToggle(next: boolean) {
    // The block dialog collects a reason when blocking; the row switch is
    // only wired to the "unblock" direction (the dialog handles "block").
    if (next) {
      setBlockOpen(true);
      return;
    }
    try {
      await setUserAiBlockApi(user.id, { isBlocked: false });
      toast.success(`${user.name ?? "User"} AI access restored.`);
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not unblock the user. Please try again.",
      );
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Select
        value={user.role}
        onValueChange={(value) =>
          handleRoleChange(value as "USER" | "SUPER_ADMIN")
        }
        disabled={isPending}
      >
        <SelectTrigger size="sm" className="min-w-[7rem]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="USER">User</SelectItem>
          <SelectItem value="SUPER_ADMIN">Admin</SelectItem>
        </SelectContent>
      </Select>

      <Switch
        checked={user.aiUsage?.isBlocked ?? false}
        onCheckedChange={handleBlockToggle}
        disabled={isPending || !user.aiUsage}
        aria-label={`Toggle AI block for ${user.name ?? user.id}`}
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => setQuotaOpen(true)}
        disabled={isPending || !user.aiUsage}
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        Quota
      </Button>

      <BlockDialog
        user={user}
        open={blockOpen}
        onOpenChange={setBlockOpen}
        onSaved={onSaved}
      />
      <QuotaDialog
        user={user}
        open={quotaOpen}
        onOpenChange={setQuotaOpen}
        onSaved={onSaved}
      />
    </div>
  );
}

const blockSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Reason must contain at least 3 characters")
    .max(500, "Reason must contain at most 500 characters"),
});

type BlockFormValues = z.infer<typeof blockSchema>;

interface BlockDialogProps {
  user: AdminUserView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

/** Collects the mandatory `reason` when an admin blocks a user's AI access. */
function BlockDialog({ user, open, onOpenChange, onSaved }: BlockDialogProps) {
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BlockFormValues>({
    resolver: zodResolver(blockSchema),
    defaultValues: { reason: "" },
  });

  async function submit(values: BlockFormValues) {
    setFormError(null);
    setBusy(true);
    try {
      await setUserAiBlockApi(user.id, {
        isBlocked: true,
        reason: values.reason,
      });
      toast.success(`${user.name ?? "User"} blocked from AI.`);
      reset({ reason: "" });
      onOpenChange(false);
      onSaved();
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Could not block the user. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block AI access?</DialogTitle>
          <DialogDescription>
            {user.name ?? "This user"} will be unable to send AI messages on
            their next request. A reason is recorded for the audit trail.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          {formError ? <FormError>{formError}</FormError> : null}
          <div className="space-y-1.5">
            <label htmlFor="block-reason" className="text-sm font-medium">
              Reason
            </label>
            <Textarea
              id="block-reason"
              rows={3}
              maxLength={500}
              disabled={busy}
              placeholder="e.g. Repeated abuse of the assistant."
              aria-invalid={Boolean(errors.reason)}
              {...register("reason")}
            />
            {errors.reason?.message ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.reason.message}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={busy}>
              {busy ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Blocking…
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4" aria-hidden="true" />
                  Block access
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const quotaSchema = z.object({
  dailyLimit: z
    .number()
    .int("Daily limit must be an integer")
    .min(0, "Daily limit cannot be negative")
    .max(10_000_000, "Daily limit is too large"),
  weeklyLimit: z
    .number()
    .int("Weekly limit must be an integer")
    .min(0, "Weekly limit cannot be negative")
    .max(100_000_000, "Weekly limit is too large"),
  monthlyLimit: z
    .number()
    .int("Monthly limit must be an integer")
    .min(0, "Monthly limit cannot be negative")
    .max(1_000_000_000, "Monthly limit is too large"),
});

type QuotaFormValues = z.infer<typeof quotaSchema>;

interface QuotaDialogProps {
  user: AdminUserView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

/** Adjusts the three AI quota windows for one user. */
function QuotaDialog({ user, open, onOpenChange, onSaved }: QuotaDialogProps) {
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const usage = user.aiUsage;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuotaFormValues>({
    resolver: zodResolver(quotaSchema),
    defaultValues: {
      dailyLimit: usage?.dailyLimit ?? 0,
      weeklyLimit: usage?.weeklyLimit ?? 0,
      monthlyLimit: usage?.monthlyLimit ?? 0,
    },
  });

  // Re-seed when the dialog re-opens so a stale edit doesn't survive a
  // refresh from the server.
  function handleOpenChange(next: boolean) {
    if (next && usage) {
      reset({
        dailyLimit: usage.dailyLimit,
        weeklyLimit: usage.weeklyLimit,
        monthlyLimit: usage.monthlyLimit,
      });
    }
    onOpenChange(next);
  }

  async function submit(values: QuotaFormValues) {
    setFormError(null);
    setBusy(true);
    try {
      await setUserAiQuotaApi(user.id, values);
      toast.success(`${user.name ?? "User"} quota updated.`);
      onOpenChange(false);
      onSaved();
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Could not update the quota. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI quota for {user.name ?? "this user"}</DialogTitle>
          <DialogDescription>
            Limits below the amount already used in a window are rejected —
            raise the limit or wait for the window to reset.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          {formError ? <FormError>{formError}</FormError> : null}
          <Field
            id="dailyLimit"
            label={`Daily limit (used: ${usage?.dailyUsed ?? 0})`}
            type="number"
            min={0}
            step={1}
            disabled={busy}
            error={errors.dailyLimit?.message}
            {...register("dailyLimit", { valueAsNumber: true })}
          />
          <Field
            id="weeklyLimit"
            label={`Weekly limit (used: ${usage?.weeklyUsed ?? 0})`}
            type="number"
            min={0}
            step={1}
            disabled={busy}
            error={errors.weeklyLimit?.message}
            {...register("weeklyLimit", { valueAsNumber: true })}
          />
          <Field
            id="monthlyLimit"
            label={`Monthly limit (used: ${usage?.monthlyUsed ?? 0})`}
            type="number"
            min={0}
            step={1}
            disabled={busy}
            error={errors.monthlyLimit?.message}
            {...register("monthlyLimit", { valueAsNumber: true })}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Saving…
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Save quota
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
