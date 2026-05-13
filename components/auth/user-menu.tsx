"use client";

import * as React from "react";
import { UserRound } from "lucide-react";

import { CustomerAccountLinks } from "@/components/auth/customer-account-links";
import { LogoutButton } from "@/components/auth/logout-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

export function UserMenu({ className, session: initialSession }: UserMenuProps) {
  const [session, setSession] = React.useState(initialSession);

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
        setSession(buildSessionUserInfo(result.user));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [initialSession.user]);

  const { displayName, email, initials, mobile } = session;
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
          <Avatar size="sm">
            <AvatarFallback className="bg-rose-100 text-rose-900">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sr-only max-w-28 truncate text-sm sm:inline">
            {displayName}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 p-2">
        <DropdownMenuLabel className="p-0">
          <div className="flex items-center gap-3 rounded-lg bg-[#fffaf6] p-3">
            <Avatar size="lg">
              <AvatarFallback className="bg-rose-100 text-rose-900">
                {initials}
              </AvatarFallback>
            </Avatar>
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
