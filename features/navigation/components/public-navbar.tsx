"use client";

import Link from "next/link";
import { Bell, Menu, Sparkles } from "lucide-react";

import { CustomerAccountLinks } from "@/components/auth/customer-account-links";
import { UserMenu } from "@/components/auth/user-menu";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/shared/logo/logo";
import type { AuthUser } from "@/features/auth/actions/auth-action.types";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { publicNavItems } from "../navigation.config";
import { NavLinkItem } from "./nav-link-item";

type PublicNavbarProps = {
  user?: AuthUser | null;
};

export function PublicNavbar({ user }: PublicNavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-rose-100/80 bg-[#fffaf6]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo size="md" priority />

        <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
          {publicNavItems.map((item) => (
            <NavLinkItem item={item} key={item.href} variant="topbar" />
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? null : (
            <Button asChild variant="ghost">
              <Link href="/signin">Sign in</Link>
            </Button>
          )}
          <Button asChild className="bg-rose-900 text-white hover:bg-rose-800">
            <Link href="/account/book">
              <Sparkles className="size-4" />
              {user ? "Book" : "Book Now"}
            </Link>
          </Button>
          {user ? (
            <>
              <Button asChild aria-label="Notifications" size="icon" variant="outline">
                <Link href="/account/notifications">
                  <Bell className="size-4" />
                </Link>
              </Button>
              <UserMenu user={user} />
            </>
          ) : null}
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button aria-label="Open navigation" className="lg:hidden" size="icon" variant="outline">
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-[#fffaf6]" side="right">
            <SheetHeader>
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <nav className="grid gap-1 px-4" aria-label="Mobile navigation">
              {publicNavItems.map((item) => (
                <SheetClose asChild key={item.href}>
                  <NavLinkItem item={item} variant="sidebar" />
                </SheetClose>
              ))}
            </nav>
            <div className="mt-auto grid gap-2 p-4">
              {user ? (
                <div className="border-t border-rose-100 pt-4">
                  <p className="px-3 pb-2 text-xs font-semibold uppercase text-stone-400">
                    Account
                  </p>
                  <CustomerAccountLinks variant="sheet" />
                </div>
              ) : (
                <Button asChild variant="outline">
                  <Link href="/signin">Sign in</Link>
                </Button>
              )}
              <Button asChild className="bg-rose-900 text-white hover:bg-rose-800">
                <Link href="/account/book">Book Now</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
