"use client";

// Load the shared class utility so drawer callers can extend its default sizing.
import { cn } from "@/src/lib/utils";
// Load the close icon used by the accessible drawer dismissal control.
import { X } from "lucide-react";
// Load the installed Radix dialog primitives that provide focus and keyboard behavior.
import { Dialog as SheetPrimitive } from "radix-ui";
// Load React prop types inferred directly from each Radix primitive.
import type { ComponentProps } from "react";

// Expose the Radix root through the project's focused Sheet component API.
function Sheet(props: ComponentProps<typeof SheetPrimitive.Root>) {
  // Forward controlled state without introducing application-specific behavior.
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

// Expose the element that opens the responsive navigation drawer.
function SheetTrigger(props: ComponentProps<typeof SheetPrimitive.Trigger>) {
  // Forward trigger props so callers can compose the shared Button with asChild.
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

// Render the drawer overlay and right-side panel inside a document-level portal.
function SheetContent({
  children,
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Content>) {
  // Keep focus trapping, Escape dismissal, and background isolation owned by Radix.
  return (
    <SheetPrimitive.Portal>
      {/* Dim inactive page content while keeping the current route visually recognizable. */}
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/35 backdrop-blur-[1px]" />
      {/* Anchor navigation to the right edge without depending on viewport JavaScript. */}
      <SheetPrimitive.Content
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col border-l border-border bg-background p-6 text-foreground shadow-2xl outline-none",
          className,
        )}
        data-slot="sheet-content"
        {...props}
      >
        {/* Render caller-owned navigation and footer content inside the drawer. */}
        {children}
        {/* Provide a visible keyboard-accessible dismissal control. */}
        <SheetPrimitive.Close
          aria-label="Close navigation"
          className="absolute top-5 right-5 flex size-10 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* Hide the decorative close icon from assistive technologies. */}
          <X aria-hidden="true" className="size-5" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

// Render consistent introductory spacing at the top of every drawer.
function SheetHeader({
  className,
  ...props
}: ComponentProps<"div">) {
  // Keep title content clear of the close control without fixed heights.
  return (
    <div
      className={cn("space-y-1 pr-12 text-left", className)}
      data-slot="sheet-header"
      {...props}
    />
  );
}

// Expose the accessible title required by the underlying dialog primitive.
function SheetTitle(props: ComponentProps<typeof SheetPrimitive.Title>) {
  // Apply readable heading styles while preserving caller-owned content.
  return (
    <SheetPrimitive.Title
      className="font-display text-2xl font-semibold tracking-tight"
      data-slot="sheet-title"
      {...props}
    />
  );
}

// Expose supporting drawer copy through the accessible dialog description primitive.
function SheetDescription(
  props: ComponentProps<typeof SheetPrimitive.Description>,
) {
  // Keep supporting content readable while allowing visually hidden caller styles.
  return (
    <SheetPrimitive.Description
      className="text-sm text-muted-foreground"
      data-slot="sheet-description"
      {...props}
    />
  );
}

// Export only the Sheet pieces needed by responsive navigation.
export {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
};
