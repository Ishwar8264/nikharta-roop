import { SectionHeading } from "@/components/shared/section-heading";
import { howItWorks } from "@/config/home";

/**
 * How it works — a three-step explainer.
 *
 * Why three steps and not four:
 * Booking is genuinely three actions: choose, schedule, confirm. A fourth
 * ("enjoy your visit") is fluff that pads the row and slows the read. Three
 * is also the maximum that still feels like a single glance on mobile.
 *
 * Why numbered circles rather than icons only:
 * The numbers imply order — the icons alone would leave a first-time user
 * unsure whether the flow is sequential or three parallel options.
 */
export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeading
        eyebrow="How it works"
        title="Booked in three steps"
        description="From search to glow-up in under a minute."
        className="[&_h2]:text-background [&_p]:text-background/65"
      />

      <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
        {howItWorks.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === howItWorks.length - 1;

          return (
            <div
              key={step.step}
              className="relative flex flex-col items-center text-center"
            >
              {/* Connector line on desktop, hidden on the last step */}
              {!isLast ? (
                <div
                  aria-hidden="true"
                  className="absolute left-1/2 top-8 hidden h-px w-full bg-background/15 md:block"
                />
              ) : null}

              <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-background/15 bg-background/10">
                <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {step.step}
                </span>
              </span>

              <h3 className="mt-5 font-heading text-lg font-semibold tracking-tight text-background">
                {step.title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-background/60">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
      </div>
    </section>
  );
}
