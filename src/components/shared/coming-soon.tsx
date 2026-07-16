// Load one brand-aligned icon for the temporary public landing state.
import { Sparkles } from "lucide-react";

// Describe the optional copy used to reuse this placeholder across role pages.
type ComingSoonProps = {
  // Explain which application area is currently being prepared.
  description?: string;
  // Show a compact role or product label above the main heading.
  eyebrow?: string;
  // Give each placeholder page one direct customer-facing message.
  title?: string;
};

// Render a focused theme-aware placeholder while the public experience is prepared.
export function ComingSoon({
  description = "We are preparing a fresh salon experience designed around your style. Please check back soon.",
  eyebrow = "Nikharta Roop Salon",
  title = "Something beautiful is coming soon.",
}: ComingSoonProps) {
  // Keep temporary content centered beneath the responsive public navbar.
  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-background px-4 py-12 text-foreground sm:px-6">
      {/* Constrain the message so it remains readable on phones, tablets, and desktops. */}
      <section className="w-full max-w-2xl rounded-3xl border border-border bg-card p-8 text-center text-card-foreground shadow-salon sm:p-12">
        {/* Reuse the salon accent treatment without adding another visual pattern. */}
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Sparkles aria-hidden="true" className="size-6" />
        </span>

        {/* Introduce the temporary state with the established editorial font. */}
        <p className="mt-7 text-xs font-bold tracking-[0.22em] text-primary uppercase">
          {eyebrow}
        </p>

        {/* Keep the primary message direct for customers reaching the root route. */}
        <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
          {title}
        </h1>

        {/* Explain the temporary page without promising unavailable features or dates. */}
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </p>
      </section>
    </main>
  );
}
