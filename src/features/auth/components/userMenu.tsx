"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { navIconMap, userMenuNav } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { useLogout } from "../hooks/useLogout";
import type { CurrentUser } from "../shared/types";

/**
 * Avatar dropdown for a signed-in user.
 *
 * Why client:
 * The dropdown holds open/close state and the logout button dispatches an
 * action. Neither is possible on the server.
 *
 * Why user comes as a prop:
 * The parent Header is a Server Component and already has the user in hand.
 * Passing it directly avoids a second subscription to AuthContext.
 *
 * Why navIconMap:
 * `userMenuNav` stores icon names as strings (server-safe). React components
 * cannot cross the server→client boundary, so the map resolves the string to
 * a Lucide component inside this client component.
 */
export function UserMenu({ user }: { user: CurrentUser }) {
  const pathname = usePathname();
  const { logout, isLoading } = useLogout();

  const initials = getInitials(user.name, user.email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Open user menu"
          />
        }
      >
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar}
            alt=""
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-medium">
            {user.name ?? "Your account"}
          </p>
          {user.email ? (
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          ) : null}
        </div>

        <DropdownMenuSeparator />

        {userMenuNav.map((item) => {
          const Icon = item.icon ? navIconMap[item.icon] : null;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <DropdownMenuItem
              key={item.href}
              render={
                <Link
                  href={item.href}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2",
                    isActive && "bg-accent",
                  )}
                />
              }
            >
              {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
              {item.label}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => void logout()}
          disabled={isLoading}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {isLoading ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Builds one- or two-letter initials for the avatar fallback.
 *
 * Why not just first letter:
 * Two initials disambiguate "Amit Sharma" from "Anita Singh" at a glance.
 */
function getInitials(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.split("@")[0] || "?";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (
    parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)
  ).toUpperCase();
}
