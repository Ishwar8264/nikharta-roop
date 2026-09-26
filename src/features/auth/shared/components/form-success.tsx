import { cn } from "@/lib/utils";

/**
 * Form-level success banner.
 *
 * Why no "use client":
 * Pure render. Login page uses it to show "Account created" after redirect.
 */
interface FormSuccessProps {
  children: React.ReactNode;
  className?: string;
}

export function FormSuccess({ children, className }: FormSuccessProps) {
  if (!children) return null;

  return (
    <div
      role="status"
      className={cn(
        "rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success",
        className,
      )}
    >
      {children}
    </div>
  );
}
