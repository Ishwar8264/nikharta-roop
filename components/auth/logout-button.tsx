"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  showError,
  showSuccess,
} from "@/components/ui/shared/toast/custom-toast";
import { logoutAction } from "@/features/auth/actions/auth.actions";
import type { AuthActionState } from "@/features/auth/actions/auth-action.types";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  className?: string;
  compact?: boolean;
};

export function LogoutButton({
  className,
  compact = false,
}: LogoutButtonProps) {
  const router = useRouter();
  const [state, setState] = React.useState<AuthActionState | null>(null);
  const [isPending, startTransition] = React.useTransition();

  // Logout is a Server Action call, not a browser fetch to the logout API.
  // The action revokes the session, clears HttpOnly cookies, and returns the
  // next route for the client to navigate to.
  function handleLogout() {
    startTransition(async () => {
      const result = await logoutAction();
      setState(result);

      if (result.success) {
        showSuccess("Logged out", result.message);
      } else {
        showError("Logout failed", result.message);
      }

      if (result.data?.redirectTo) {
        router.replace(result.data.redirectTo);
        router.refresh();
      }
    });
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        aria-label="Logout"
        className={compact ? undefined : "w-full justify-start font-semibold"}
        disabled={isPending}
        onClick={handleLogout}
        size={compact ? "icon" : "default"}
        type="button"
        variant="destructive"
      >
        <LogOut className="size-4" />
        {compact ? null : isPending ? "Logging out..." : "Logout"}
      </Button>

      {state && !state.success && !compact ? (
        <p className="text-xs text-destructive">{state.message}</p>
      ) : null}
    </div>
  );
}
