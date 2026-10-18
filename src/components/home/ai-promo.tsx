import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { aiPromo } from "@/config/home";
import { routes } from "@/config/routes";

/**
 * AI assistant promo — the product's differentiator.
 *
 * Why a two-column layout with a fake chat bubble:
 * "AI" is abstract until it's shown. A minimal chat mockup makes the value
 * tangible in under a second — the user sees a question and an answer
 * without needing to read a paragraph.
 *
 * Why it sits after testimonials:
 * By this point the reader has seen the offer (hero), the inventory
 * (featured salons), the process (how it works), and the proof
 * (testimonials). The AI block is the "and there's more" that lifts the
 * whole pitch rather than competing for the first screen.
 */
export function AiPromo() {
  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-2 lg:gap-20">
        {/* ─── Copy column ─── */}
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {aiPromo.eyebrow}
          </p>

          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {aiPromo.headline}
          </h2>

          <p className="mt-4 text-base text-muted-foreground">
            {aiPromo.description}
          </p>

          <div className="mt-8">
            <Button
              render={<Link href={routes.ai} />}
                size="lg"
            >
              {aiPromo.cta.label}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ─── Chat mockup ─── */}
        <div className="relative">
          <div className="space-y-5 rounded-[2rem] border border-border/70 bg-card p-6 shadow-2xl shadow-primary/5 sm:p-8">
            {/* User message */}
            <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
              I have a wedding next weekend. What should I get done?
            </div>

            {/* Assistant message */}
            <div className="flex max-w-[85%] gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm text-foreground">
                For a wedding, I&apos;d suggest a hair spa 5 days before, then a
                blowout on the day. I found 3 salons near you with verified
                bridal packages.
              </div>
            </div>

            {/* Typing indicator */}
            <div className="flex items-center gap-2 pl-11 pt-1">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageCircle className="h-3 w-3" aria-hidden="true" />
                Nikharta AI
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
