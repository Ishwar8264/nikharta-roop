import { cn } from "@/lib/utils";

interface FormHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

/**
 * Provides a consistent title and description for card-based forms.
 *
 * Why:
 * Keeping the heading inside the form card removes disconnected page spacing
 * and gives create/edit screens one reusable header hierarchy.
 */
export function FormHeader({
  title,
  description,
  className,
}: FormHeaderProps) {
  return (
    <header className={cn("space-y-1", className)}>
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}
