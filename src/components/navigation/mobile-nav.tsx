"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { NavItem } from "./nav-item";
import { publicNav } from "./nav.config";

/**
 * Drawer navigation for small and medium screens.
 *
 * Why:
 * "use client" is required: the sheet holds open/close state in React so
 * that the trigger button and the drawer body stay in sync. The nav data
 * still comes from `nav.config`, and each link still renders via the shared
 * `NavItem`, so no styling or logic is duplicated.
 *
 * `lg:hidden` hides the trigger on desktop — the same CSS-only visibility
 * rule DesktopNav uses, keeping the two components symmetric.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open menu"
          />
        }
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>

      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <nav aria-label="Primary" className="mt-6 flex flex-col gap-1 px-2">
          {publicNav.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              variant="mobile"
              onNavigate={() => setOpen(false)}
            />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
