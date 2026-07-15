"use client";

// Load shared active-aware navigation rendering for the mobile drawer.
import { NavLinks } from "@/src/components/navigation/nav-links";
// Load the strict navigation item contract supplied by each route layout.
import type { NavigationItem } from "@/src/components/navigation/navigation.config";
// Load the shared button used as the accessible drawer trigger.
import { Button } from "@/src/components/ui/button";
// Load the focused Sheet API backed by installed Radix dialog primitives.
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/src/components/ui/sheet";
// Load the recognizable menu icon used by compact headers.
import { Menu } from "lucide-react";
// Load focused client state and the optional footer content type.
import { useState } from "react";
import type { ReactNode } from "react";

// Describe the navigation data and optional account controls shown in the drawer.
type MobileNavProps = {
  // Render theme or account controls beneath the route list when supplied.
  footer?: ReactNode;
  // Reuse the exact destinations selected by the surrounding route layout.
  navigationItems: readonly NavigationItem[];
};

// Render one accessible mobile and tablet navigation drawer below the desktop breakpoint.
export function MobileNav({ footer, navigationItems }: MobileNavProps) {
  // Track controlled drawer state so route selection can close it reliably.
  const [isOpen, setIsOpen] = useState(false);

  // Close the drawer immediately after a customer selects one destination.
  const handleNavigate = () => {
    // Return focus to the menu trigger through the controlled Radix root.
    setIsOpen(false);
  };

  // Keep the drawer mounted only through the shared Radix interaction boundary.
  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      {/* Compose the shared compact button as the semantic drawer trigger. */}
      <SheetTrigger asChild>
        <Button aria-label="Open navigation" size="icon" variant="outline">
          {/* Hide the decorative menu icon from assistive technologies. */}
          <Menu aria-hidden="true" className="size-5" />
        </Button>
      </SheetTrigger>

      {/* Keep the drawer width safe on small phones and comfortable on tablets. */}
      <SheetContent>
        {/* Identify the navigation dialog clearly for assistive technologies. */}
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          {/* Explain the drawer purpose without adding visible repetitive copy. */}
          <SheetDescription className="sr-only">
            Choose a destination or manage your account preferences.
          </SheetDescription>
        </SheetHeader>

        {/* Skip an empty navigation landmark when no route links are configured. */}
        {navigationItems.length > 0 ? (
          <NavLinks
            ariaLabel="Mobile navigation"
            className="mt-8"
            items={navigationItems}
            onNavigate={handleNavigate}
            variant="sidebar"
          />
        ) : null}

        {/* Keep optional account controls pinned below navigation without overlap. */}
        {footer ? (
          <div className="mt-auto border-t border-border pt-5">{footer}</div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
