"use client";
import { canAccessAdmin, adminDestination } from "@/lib/auth/permissions";

import { LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { RouterProvider } from "react-aria-components";
import { usePathname, useRouter } from "next/navigation";

import { UserBadge } from "@/components/shared/user-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { routes } from "@/config/routes";

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
 */
export function UserMenu({ user }: { user: CurrentUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, isLoading } = useLogout();

  return (
    <RouterProvider navigate={(href) => router.push(href)}>
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
          <UserBadge
            name={user.name}
            email={user.email}
            avatar={user.avatar}
            showName={false}
            avatarAlt=""
            avatarClassName="size-7"
            fallbackClassName="text-xs"
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuItem
              textValue={user.name ?? "Your account"}
              aria-label={`${user.name ?? "Your account"} — View profile`}
              render={<Link href={routes.profile} />}
              className="block cursor-pointer px-2 py-2"
            >
              <p className="truncate text-sm font-medium">
                {user.name ?? "Your account"}
              </p>
              {user.email ? (
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              ) : null}
            </DropdownMenuItem>

            {canAccessAdmin(user.role) && (
              <DropdownMenuItem
                textValue="Admin"
                render={
                  <Link
                    href={adminDestination(user.role)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2",
                      pathname.startsWith("/admin/") && "bg-accent",
                    )}
                  />
                }
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Admin
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              textValue={isLoading ? "Signing out…" : "Sign out"}
              onAction={() => void logout()}
              disabled={isLoading}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {isLoading ? "Signing out…" : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </RouterProvider>
  );
}
