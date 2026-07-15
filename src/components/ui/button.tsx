import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "@/src/lib/utils";

// Define every supported button appearance in one reusable shadcn style recipe.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-xl border border-transparent bg-clip-padding text-sm font-semibold outline-none transition-all select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    // Keep visual intent explicit through named variants instead of repeated classes.
    variants: {
      // Map each action priority to semantic theme colors.
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        ghost:
          "hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent",
        link: "text-primary underline-offset-4 hover:underline",
        outline:
          "border-border bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
      // Offer predictable control heights for forms and compact actions.
      size: {
        default: "h-10 gap-2 px-4 py-2",
        icon: "size-10",
        lg: "h-11 gap-2 px-6",
        sm: "h-9 gap-1.5 px-3",
      },
    },
    // Use the primary medium button when callers do not specify styling.
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  },
);

// Render a semantic button or pass styles to one composed Radix child.
function Button({
  asChild = false,
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  // Use Radix Slot only when another semantic element must receive button styling.
  const Component = asChild ? Slot.Root : "button";

  // Merge caller classes after the selected shadcn variants.
  return (
    <Component
      className={cn(buttonVariants({ className, size, variant }))}
      data-size={size}
      data-slot="button"
      data-variant={variant}
      {...props}
    />
  );
}

// Export both the component and recipe for semantic link styling.
export { Button, buttonVariants };
