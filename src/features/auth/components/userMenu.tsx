"use client";

import { canCreateSalon, isOnboardingComplete } from "@/features/onboarding/policy";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { RouterProvider } from "react-aria-components";
import { usePathname, useRouter } from "next/navigation";

import { navIconMap, userMenuNav } from "@/components/navigation";
import { UserBadge } from "@/components/shared/user-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
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
            <DropdownMenuLabel className="px-2 py-1.5">
              <p className="truncate text-sm font-medium">
                {user.name ?? "Your account"}
              </p>
              {user.email ? (
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              ) : null}
            </DropdownMenuLabel>

            {userMenuNav.map((item) => {
              const Icon = item.icon ? navIconMap[item.icon] : null;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <DropdownMenuItem
                  key={item.href}
                  textValue={item.label}
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
                  {Icon ? (
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  ) : null}
                  {item.label}
                </DropdownMenuItem>
              );
            })}

            <DropdownMenuItem render={<Link href="/onboarding" />} textValue="Account setup">
              {isOnboardingComplete(user) ? "Account preferences" : "Complete account setup"}
            </DropdownMenuItem>
            <DropdownMenuItem
              render={<Link href={canCreateSalon(user) ? "/salons/create" : "/onboarding?type=partner"} />}
              textValue="Salon partner"
            >
              {canCreateSalon(user) ? "Add salon" : "Become a salon partner"}
            </DropdownMenuItem>
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
