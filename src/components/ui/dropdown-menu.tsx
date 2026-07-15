"use client";

// Load the shared class utility to combine default and caller styles safely.
import { cn } from "@/src/lib/utils";
// Load the check icon used to mark the currently selected radio item.
import { Check } from "lucide-react";
// Load the accessible dropdown primitives provided by the installed Radix package.
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
// Load React types used to infer every primitive component prop.
import type { ComponentProps } from "react";

// Expose the Radix root through the project's reusable UI component API.
function DropdownMenu(
  props: ComponentProps<typeof DropdownMenuPrimitive.Root>,
) {
  // Forward all behavior props without adding application-specific logic.
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

// Expose the accessible element that opens and closes the dropdown.
function DropdownMenuTrigger(
  props: ComponentProps<typeof DropdownMenuPrimitive.Trigger>,
) {
  // Forward trigger props so callers can compose their own button with asChild.
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  );
}

// Render dropdown content inside a portal so parent overflow cannot clip it.
function DropdownMenuContent({
  align = "start",
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  // Move the menu to a document-level portal and preserve keyboard focus behavior.
  return (
    <DropdownMenuPrimitive.Portal>
      {/* Style the shared floating panel while allowing caller overrides. */}
      <DropdownMenuPrimitive.Content
        align={align}
        className={cn(
          "z-50 min-w-36 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none",
          className,
        )}
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

// Render a standard actionable row for navigation and account menu choices.
function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  // Preserve Radix keyboard behavior while applying the shared menu item treatment.
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "flex cursor-default items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      data-slot="dropdown-menu-item"
      {...props}
    />
  );
}

// Render quiet supporting text above a related group of account actions.
function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  // Keep menu headings visually distinct without competing with actionable rows.
  return (
    <DropdownMenuPrimitive.Label
      className={cn("px-2 py-1.5 text-sm font-semibold", className)}
      data-slot="dropdown-menu-label"
      {...props}
    />
  );
}

// Separate related dropdown groups without introducing another layout wrapper.
function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  // Use the semantic border token so the divider follows light and dark themes.
  return (
    <DropdownMenuPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      data-slot="dropdown-menu-separator"
      {...props}
    />
  );
}

// Group mutually exclusive menu options for accessible theme selection.
function DropdownMenuRadioGroup(
  props: ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>,
) {
  // Forward the selected value and change handler to the Radix radio group.
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

// Render one selectable menu option with a built-in selected-state indicator.
function DropdownMenuRadioItem({
  children,
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  // Keep selection, keyboard navigation, disabled state, and focus styling accessible.
  return (
    <DropdownMenuPrimitive.RadioItem
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-2 pr-8 pl-2 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      data-slot="dropdown-menu-radio-item"
      {...props}
    >
      {/* Render the caller's icon and label as the visible option content. */}
      {children}
      {/* Position the selected-state indicator consistently on the right. */}
      <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
        {/* Show the check icon only when Radix marks this item as selected. */}
        <DropdownMenuPrimitive.ItemIndicator>
          {/* Hide the decorative indicator from assistive technologies. */}
          <Check aria-hidden="true" className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
    </DropdownMenuPrimitive.RadioItem>
  );
}

// Export only the focused dropdown pieces currently supported by the application.
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
};
