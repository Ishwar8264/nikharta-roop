// Load the concise visitor journey shown by this server component.
import { JOURNEY_STEPS } from "@/src/components/public/home/home-content";
// Load the shared public section heading treatment.
import { SectionHeading } from "@/src/components/public/home/section-heading";
// Load one decorative check icon for the supporting trust panel.
import { Check } from "lucide-react";

// Explain how discovery naturally moves toward an account-managed salon visit.
export function JourneySection() {
  // Keep journey steps and practical trust details visually connected.
  return (
    <section className="border-b border-border bg-surface-soft py-16 text-surface-soft-foreground sm:py-20 lg:py-24">
      {/* Use one responsive grid to separate the journey from supporting detail. */}
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_0.78fr] lg:gap-16 lg:px-10">
        {/* Keep the step sequence readable without timelines or client animation. */}
        <div>
          {/* Introduce the experience as three simple visitor decisions. */}
          <SectionHeading
            description="A clear path from the first idea to a salon experience you can manage with confidence."
            eyebrow="How it works"
            title="From inspiration to your next appointment."
          />

          {/* Render the journey as an ordered list for semantic sequence. */}
          <ol className="mt-10 space-y-4">
            {JOURNEY_STEPS.map(({ description, number, title }) => (
              // Keep the step number, heading, and explanation in one focused row.
              <li
                className="grid gap-4 rounded-3xl border border-border bg-card p-5 text-card-foreground sm:grid-cols-[auto_1fr] sm:p-6"
                key={number}
              >
                {/* Make sequence visible without depending on color alone. */}
                <span className="font-display flex size-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {number}
                </span>
                {/* Keep each step explanation close to its action-oriented title. */}
                <div>
                  <h3 className="font-display text-xl font-semibold tracking-[-0.02em] sm:text-2xl">
                    {title}
                  </h3>
                  <p className="mt-2 leading-7 text-muted-foreground">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Explain the information visitors can expect without inventing social proof. */}
        <aside className="self-start rounded-[2rem] border border-border bg-card p-7 text-card-foreground shadow-salon sm:p-9 lg:sticky lg:top-6">
          {/* Keep this panel framed around decision quality rather than brand claims. */}
          <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
            Designed for clear choices
          </p>
          {/* State the practical benefit of the schema-backed information model. */}
          <h2 className="font-display mt-3 text-3xl font-semibold tracking-[-0.03em]">
            Details that help before you visit.
          </h2>

          {/* Group supporting decision signals into one readable list. */}
          <ul className="mt-7 space-y-5">
            {/* Connect service discovery with expected price and duration details. */}
            <li className="flex gap-3">
              <Check aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
              <span className="leading-7 text-muted-foreground">
                Service descriptions, duration, pricing, and suitability details.
              </span>
            </li>
            {/* Connect branch discovery with real-world visit planning. */}
            <li className="flex gap-3">
              <Check aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
              <span className="leading-7 text-muted-foreground">
                Branch addresses, contact information, hours, and availability context.
              </span>
            </li>
            {/* Connect portfolio and verified reviews with visitor confidence. */}
            <li className="flex gap-3">
              <Check aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" />
              <span className="leading-7 text-muted-foreground">
                Professional profiles, real work, and approved booking-linked reviews.
              </span>
            </li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
