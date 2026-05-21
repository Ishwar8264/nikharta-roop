/**
 * Purpose: Customer account dropdown menu for authenticated layouts.
 * Responsibilities: show avatar/profile shortcuts, customer account links, and logout control.
 * Important notes: server-provided session data is preferred, with a client fallback for reused contexts.
 */
"use client";

import * as React from "react";
import { UserRound } from "lucide-react";

import { CustomerAccountLinks } from "@/components/auth/customer-account-links";
import { LogoutButton } from "@/components/auth/logout-button";
import { UserAvatar } from "@/components/auth/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrentUserAction } from "@/features/auth/actions/auth.actions";
import { buildSessionUserInfo } from "@/features/auth/helpers/session-user-info.shared";
import type { SessionUserInfo } from "@/features/auth/helpers/session-user-info.types";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  className?: string;
  session: SessionUserInfo;
};

/**
 * Renders the authenticated user menu and lazily recovers missing user data when needed.
 */
export function UserMenu({ className, session: initialSession }: UserMenuProps) {
  const [fetchedSession, setFetchedSession] =
    React.useState<SessionUserInfo | null>(null);

  // User identity is passed from the protected account layout. This fallback
  // keeps the component resilient if it is reused somewhere that cannot provide
  // a server-loaded user yet.
  React.useEffect(() => {
    if (initialSession.user) {
      return;
    }

    let isMounted = true;

    getCurrentUserAction().then((result) => {
      if (isMounted && result.success) {
        setFetchedSession(buildSessionUserInfo(result.user));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [initialSession.user]);

  const session = initialSession.user ? initialSession : (fetchedSession ?? initialSession);
  const { avatarUrl, displayName, email, initials, mobile } = session;
  const subtitle = mobile || email || "Signed in";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Open user menu"
          className={cn(
            "gap-2 border-transparent bg-transparent px-2 shadow-none hover:bg-rose-50",
            className,
          )}
          type="button"
          variant="ghost"
        >
          <UserAvatar avatarUrl={avatarUrl} displayName={displayName} initials={initials} size="sm" />
          <span className="hidden sr-only max-w-28 truncate text-sm sm:inline">
            {displayName}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 p-2">
        <DropdownMenuLabel className="p-0">
          <div className="flex items-center gap-3 rounded-lg bg-[#fffaf6] p-3">
            <UserAvatar avatarUrl={avatarUrl} displayName={displayName} initials={initials} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-stone-950">
                {displayName}
              </p>
              <p className="truncate text-xs text-stone-500">{subtitle}</p>
            </div>
            <UserRound className="ml-auto size-4 text-stone-400" />
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />
        <CustomerAccountLinks />
        <DropdownMenuSeparator />
        <div className="p-1">
          <LogoutButton />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
