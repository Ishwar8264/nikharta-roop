// Load a focused placeholder icon for the first private customer destination.
import { Images } from "lucide-react";
// Load metadata typing for a clear private page browser title.
import type { Metadata } from "next";

// Describe the private Portfolio route in browser history and tabs.
export const metadata: Metadata = {
  // Explain that authenticated customers will manage saved salon inspiration here.
  description: "View your private Nikharta Roop beauty portfolio.",
  // Keep the route title aligned with the salon application identity.
  title: "My Portfolio | Nikharta Roop",
};

// Render the initial private Portfolio surface protected by the root Proxy.
export default function PortfolioPage() {
  // Keep the first private page intentionally focused until portfolio data is wired.
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-background px-4 py-16 text-foreground sm:px-6 lg:px-10">
      {/* Constrain the private empty state to a comfortable readable width. */}
      <section className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-8 text-center text-card-foreground shadow-salon sm:p-12">
        {/* Give the private destination a recognizable theme-aware icon. */}
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Images aria-hidden="true" className="size-6" />
        </span>

        {/* Identify the authenticated destination clearly. */}
        <h1 className="font-display mt-6 text-4xl font-semibold tracking-tight">
          Your Portfolio
        </h1>

        {/* Explain the current intentionally empty private state. */}
        <p className="mx-auto mt-4 max-w-xl leading-7 text-muted-foreground">
          Your saved looks, treatment memories, and salon inspiration will appear
          here.
        </p>
      </section>
    </main>
  );
}
