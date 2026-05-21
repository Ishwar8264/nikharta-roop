/**
 * Purpose: Internal typography and brand token preview route.
 * Responsibilities: expose metadata and render color, text, spacing, link, and code examples.
 * Important notes: this is a UI preview page, not customer-facing marketing content.
 */
import type { Metadata } from "next";
import Link from "next/link";

import { ColorSwatch } from "@/components/typography/color-swatch";
import { BrandCard } from "@/components/typography/brand-card";
import {
  BodyTextStyles,
  FontWeightPreview,
  HeadingStyles,
  InlineButtonLabelExamples,
} from "@/components/typography/typography-preview";
import { SpacingHierarchyExamples } from "@/components/typography/spacing-hierarchy";

export const metadata: Metadata = {
  title: "Typography Preview | Nikharta Roop",
  description:
    "Internal Nikharta Roop typography, color, spacing, and UI text preview.",
};

/**
 * Renders the internal typography and brand system preview.
 */
export default function TypographyBrandGuidePage() {
  return (
    <main className="min-h-screen bg-[#fffaf6] px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-10">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-stone-200 bg-white/60 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-white"
            >
              ← Home
            </Link>
          </div>
          <h1 className="mt-6 text-balance text-4xl font-semibold text-stone-950 sm:text-5xl">
            Typography Preview
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
            Headings, paragraphs, lists, blockquotes, links, and code styles ka
            quick visual.
          </p>
        </header>

        <section className="space-y-10">
          {/* Brand color palette + typography samples */}
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-semibold text-stone-950">
                Brand Color Palette
              </h2>
              <p className="max-w-2xl text-base leading-7 text-stone-600">
                Primary/Rose, Secondary/Warm Beige, Accent/Gold, Background/Soft
                Ivory, Text/Charcoal, Muted/Warm Gray.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <ColorSwatch name="Primary (Rose/Pink)" hex="#E11D48" />
              <ColorSwatch name="Secondary (Warm Beige)" hex="#F5E8D0" />
              <ColorSwatch name="Accent (Gold)" hex="#D4A017" />
              <ColorSwatch name="Background (Soft Ivory)" hex="#FFF7ED" />
              <ColorSwatch name="Text (Deep Brown/Charcoal)" hex="#2B1A17" />
              <ColorSwatch name="Muted (Warm Gray)" hex="#6B5E57" />
            </div>

            {/* Heading styles (H1 → H6) */}
            <BrandCard>
              <HeadingStyles />
            </BrandCard>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <BrandCard className="md:col-span-1">
              <BodyTextStyles />
            </BrandCard>

            <BrandCard className="md:col-span-1">
              <FontWeightPreview />
            </BrandCard>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <BrandCard className="md:col-span-1">
              <InlineButtonLabelExamples />
              <p className="mt-3 text-sm leading-6 text-stone-600">
                Example link:{" "}
                <Link
                  href="#"
                  className="font-semibold text-rose-700 hover:text-rose-800"
                >
                  hover me text change
                </Link>
              </p>
            </BrandCard>

            <BrandCard className="md:col-span-1">
              <SpacingHierarchyExamples />
            </BrandCard>
          </div>

          <BrandCard>
            <blockquote className="mt-3 rounded-2xl border border-rose-100 bg-white/70 p-4 shadow-[inset_4px_0_0_#f43f5e]">
              <p className="text-base leading-7 text-stone-700">
                “Typography ka goal: readability, hierarchy, aur consistent
                spacing.”
              </p>
            </blockquote>
          </BrandCard>

          <div className="grid gap-6 md:grid-cols-2">
            <BrandCard>
              <h3 className="text-xl font-semibold text-stone-950">
                Inline code
              </h3>
              <p className="mt-2 text-base leading-7 text-stone-600">
                Example:{" "}
                <code className="rounded bg-stone-100 px-2 py-1 text-sm font-semibold text-stone-800">
                  npm run dev
                </code>
              </p>
            </BrandCard>

            <BrandCard>
              <h3 className="text-xl font-semibold text-stone-950">
                Code block
              </h3>
              <pre className="mt-3 overflow-auto rounded-2xl bg-stone-900/95 p-4 text-sm leading-6 text-stone-100">
                <code>
                  {`type User = {
  id: string;
  name: string;
};

export function greet(user: User) {
  return \
    'Hello ' + user.name;
}`}
                </code>
              </pre>
            </BrandCard>
          </div>
        </section>

        <footer className="mt-12">
          <p className="text-sm text-stone-600">
            Note: Ye page UI-only hai, content/styling sirf typography preview ke
            liye.
          </p>
        </footer>
      </div>
    </main>
  );
}
