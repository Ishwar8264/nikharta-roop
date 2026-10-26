import { cn } from "@/lib/utils";

/**
 * Reusable section heading — eyebrow + title + optional description.
 *
 * Why extracted:
 * Nine homepage sections each need the same three-part hierarchy. One
 * component keeps the type scale, spacing, and alignment consistent across
 * them, so a change to the rhythm is one edit, not nine.
 *
 * Why server component:
 * Pure render, no hooks. Works in any tree.
 */
interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {eyebrow}
        </p>
      ) : null}

      <h2 className="mt-3 text-balance font-heading text-3xl font-semibold tracking-[-0.025em] text-foreground sm:text-4xl lg:text-5xl">
        {title}
      </h2>

      {description ? (
        <p className="mt-4 text-pretty text-base leading-7 text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
