"use client";

import { Menu } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
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
import { adminNavSections } from "../navigation.config";
import { NavLinkItem } from "./nav-link-item";

export function DashboardMobileHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-rose-100 bg-[#fffaf6]/95 px-4 backdrop-blur lg:hidden">
      <Logo size="sm" href="/admin" />

      <Sheet>
        <SheetTrigger asChild>
          <Button aria-label="Open dashboard navigation" size="icon" variant="outline">
            <Menu className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent className="bg-[#fffaf6]" side="left">
          <SheetHeader>
            <SheetTitle>Admin Menu</SheetTitle>
          </SheetHeader>
          <nav className="space-y-5 overflow-y-auto px-4 pb-6" aria-label="Mobile admin navigation">
            {adminNavSections.map((section) => (
              <section key={section.label}>
                <h2 className="px-3 text-xs font-semibold uppercase tracking-wide text-stone-400">
                  {section.label}
                </h2>
                <div className="mt-2 space-y-1">
                  {section.items.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <NavLinkItem item={item} />
                    </SheetClose>
                  ))}
                </div>
              </section>
            ))}
          </nav>
          <div className="border-t border-rose-100 px-4 pt-4">
            <LogoutButton />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
