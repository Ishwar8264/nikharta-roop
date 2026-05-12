"use client";

import Link from "next/link";
import { Bell, Menu, Sparkles } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { UserMenu } from "@/components/auth/user-menu";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/shared/logo/logo";
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

export function CustomerHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-rose-100 bg-[#fffaf6]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Logo size="sm" href="/account" />

        <nav
          aria-label="Public pages"
          className="hidden items-center gap-1 lg:flex"
        >
          {publicNavItems.map((item) => (
            <NavLinkItem item={item} key={item.href} variant="topbar" />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            className="hidden bg-rose-900 text-white hover:bg-rose-800 sm:inline-flex"
          >
            <Link href="/account/book">
              <Sparkles className="size-4" />
              Book
            </Link>
          </Button>
          <Button asChild aria-label="Notifications" size="icon" variant="outline">
            <Link href="/account/notifications">
              <Bell className="size-4" />
            </Link>
          </Button>
          <UserMenu />

          <Sheet>
            <SheetTrigger asChild>
              <Button
                aria-label="Open account navigation"
                className="lg:hidden"
                size="icon"
                variant="outline"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-[#fffaf6]" side="right">
              <SheetHeader>
                <SheetTitle>Explore Nikharta Roop</SheetTitle>
              </SheetHeader>
              <nav
                aria-label="Mobile public pages"
                className="grid gap-1 px-4"
              >
                {publicNavItems.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <NavLinkItem item={item} variant="sidebar" />
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto grid gap-2 border-t border-rose-100 p-4">
                <Button asChild className="bg-rose-900 text-white hover:bg-rose-800">
                  <Link href="/account/book">
                    <Sparkles className="size-4" />
                    Book
                  </Link>
                </Button>
                <LogoutButton />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
