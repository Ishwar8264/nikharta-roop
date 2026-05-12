"use client";

import * as React from "react";
import { UserRound } from "lucide-react";

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
import type { AuthUser } from "@/features/auth/actions/auth-action.types";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  className?: string;
};

export function UserMenu({ className }: UserMenuProps) {
  const [user, setUser] = React.useState<AuthUser | null>(null);

  // User identity is loaded through a Server Action so the client does not
  // fetch `/api/v1/auth/me` directly and never reads HttpOnly auth cookies.
  React.useEffect(() => {
    let isMounted = true;

    getCurrentUserAction().then((result) => {
      if (isMounted && result.success) {
        setUser(result.user);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = user?.name || user?.mobile || "Account";
  const subtitle = user?.mobile || user?.email || "Signed in";
  const initials = getInitials(displayName);

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
        <div className="p-1">
          <LogoutButton />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getInitials(value: string) {
  const cleanedValue = value.trim();

  if (!cleanedValue) {
    return "NR";
  }

  const words = cleanedValue.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return cleanedValue.slice(0, 2).toUpperCase();
}
