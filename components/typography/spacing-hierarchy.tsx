import { BrandCard } from "./brand-card";

export function SpacingHierarchyExamples() {
  return (
    <section className="space-y-5">
      <BrandCard>
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-700">
            Visual hierarchy + spacing
          </p>
          <h3 className="text-2xl font-semibold leading-tight text-stone-950">
            Premium hierarchy for clean scanning
          </h3>
          <p className="max-w-2xl text-base leading-7 text-stone-700">
            This block shows consistent spacing between heading → paragraph →
            helper text. Use generous padding and soft borders to maintain an
            elegant salon feel.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="rounded-full border border-stone-200 bg-white/60 px-4 py-2 text-sm font-semibold text-stone-700">
              Bridal
            </span>
            <span className="rounded-full border border-stone-200 bg-white/60 px-4 py-2 text-sm font-semibold text-stone-700">
              Engagement
            </span>
            <span className="rounded-full border border-stone-200 bg-white/60 px-4 py-2 text-sm font-semibold text-stone-700">
              Reception
            </span>
          </div>
        </div>
      </BrandCard>

      <div className="grid gap-4 md:grid-cols-2">
        <BrandCard className="p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-700">
            Tight (mobile)
          </p>
          <div className="mt-3 space-y-2 rounded-2xl border border-stone-200 bg-white/50 p-4">
            <p className="text-base font-semibold text-stone-950">Title</p>
            <p className="text-sm leading-6 text-stone-700">
              Short description with smaller spacing for compact screens.
            </p>
          </div>
        </BrandCard>

        <BrandCard className="p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-700">
            Spacious (desktop)
          </p>
          <div className="mt-3 space-y-3 rounded-2xl border border-stone-200 bg-white/50 p-6">
            <p className="text-lg font-semibold text-stone-950">
              Section Heading
            </p>
            <p className="text-base leading-7 text-stone-700">
              Larger padding and comfortable line height for a premium reading
              experience.
            </p>
            <p className="text-sm leading-6 text-stone-600">
              Helper text keeps the hierarchy calm and clear.
            </p>
          </div>
        </BrandCard>
      </div>
    </section>
  );
}
