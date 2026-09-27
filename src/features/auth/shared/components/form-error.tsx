import { cn } from "@/lib/utils";

/**
 * Form-level error banner.
 *
 * Why no "use client":
 * Pure render — takes a string, returns markup. Same reason as Field.
 */
interface FormErrorProps {
  children: React.ReactNode;
  className?: string;
}

export function FormError({ children, className }: FormErrorProps) {
  if (!children) return null;

  return (
    <div
      role="alert"
      className={cn(
        "rounded-none border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive",
        className,
      )}
    >
      {children}
    </div>
  );
}
