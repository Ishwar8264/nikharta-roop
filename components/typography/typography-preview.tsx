/**
 * Purpose: Typography preview components for the internal brand guide.
 * Responsibilities: render heading, body, weight, and inline label examples.
 * Important notes: examples are static so visual changes stay easy to compare.
 */
import * as React from "react";
import { BrandCard } from "./brand-card";

export function HeadingStyles() {
  const items: Array<{ tag: string; text: string; className: string }> = [
    { tag: "H1", text: "Nikharta Roop", className: "text-4xl sm:text-5xl" },
    {
      tag: "H2",
      text: "Premium Beauty, Effortless Glow",
      className: "text-3xl sm:text-4xl",
    },
    {
      tag: "H3",
      text: "Bridal Makeup • Skin • Hair",
      className: "text-2xl sm:text-3xl",
    },
    {
      tag: "H4",
      text: "Event-ready finishing touches",
      className: "text-xl sm:text-2xl",
    },
    {
      tag: "H5",
      text: "Clean detail, soft radiance",
      className: "text-lg sm:text-xl",
    },
    {
      tag: "H6",
      text: "Lightweight, modern typography",
      className: "text-base sm:text-lg",
    },
  ];

  return (
    <section className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((it) => (
          <BrandCard key={it.tag} className="p-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-700">
                {it.tag}
              </p>
              <span className="rounded-full border border-stone-200 bg-white/50 px-3 py-1 text-xs font-semibold text-rose-800">
                Preview
              </span>
            </div>
            <h3
              className={`${it.className} font-semibold leading-tight text-stone-950`}
            >
              {it.text}
            </h3>
          </BrandCard>
        ))}
      </div>
    </section>
  );
}

export function BodyTextStyles() {
  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <BrandCard>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-700">
                Large body
              </p>
              <p className="mt-2 text-lg leading-8 text-stone-800">
                Large body text for main descriptions, readable line height with
                a premium calm.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-700">
                Regular body
              </p>
              <p className="mt-2 text-base leading-7 text-stone-700">
                Regular body text for general paragraphs and content blocks.
              </p>
            </div>
          </div>
        </BrandCard>

        <BrandCard>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-700">
                Small text
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                Small text for form hints, metadata, and short descriptions.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-700">
                Caption
              </p>
              <p className="mt-2 text-xs leading-5 text-stone-600">
                Caption style for supporting labels and micro copy.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-700">
                Muted text
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                Muted text for secondary information, summaries, and helper
                messages.
              </p>
            </div>
          </div>
        </BrandCard>
      </div>
    </section>
  );
}

export function FontWeightPreview() {
  const rows: Array<{ label: string; weightClass: string; sample: string }> = [
    {
      label: "Light",
      weightClass: "font-light",
      sample: "Soft & airy, perfect for premium headings.",
    },
    {
      label: "Regular",
      weightClass: "font-normal",
      sample: "Balanced weight for everyday brand clarity.",
    },
    {
      label: "Medium",
      weightClass: "font-medium",
      sample: "Noticeable emphasis, great for section titles.",
    },
    {
      label: "Semibold",
      weightClass: "font-semibold",
      sample: "Strong hierarchy, use sparingly for impact.",
    },
    {
      label: "Bold",
      weightClass: "font-bold",
      sample: "High emphasis, CTA-like emphasis & highlights.",
    },
  ];

  return (
    <section className="space-y-4">
      <BrandCard className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((r) => (
            <div
              key={r.label}
              className="rounded-2xl border border-stone-200 bg-white/50 p-4"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-700">
                {r.label}
              </p>
              <p
                className={`mt-2 text-base leading-7 text-stone-950 ${r.weightClass}`}
              >
                {r.sample}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm leading-6 text-stone-600">
          Note: Font weights depend on the active font family availability;
          Tailwind applies the requested weight.
        </p>
      </BrandCard>
    </section>
  );
}

export function InlineButtonLabelExamples() {
  // Typography examples only (no external button components).
  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <BrandCard>
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-700">
              Button text (primary)
            </p>
            <div className="inline-flex items-center rounded-full border border-rose-200 bg-rose-600/10 px-4 py-3">
              <span className="text-sm font-bold uppercase tracking-[0.16em] text-rose-800">
                Reserve Your Date
              </span>
            </div>
            <p className="text-sm leading-6 text-stone-600">
              Uppercase + letter spacing for premium CTA label.
            </p>
          </div>
        </BrandCard>

        <BrandCard>
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-700">
              Label / field text
            </p>
            <div className="rounded-2xl border border-stone-200 bg-white/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-700">
                Service Type
              </p>
              <p className="mt-2 text-base font-semibold text-stone-950">
                Bridal Makeup
              </p>
            </div>
            <p className="text-sm leading-6 text-stone-600">
              Smaller uppercase label + stronger value typography.
            </p>
          </div>
        </BrandCard>
      </div>
    </section>
  );
}
