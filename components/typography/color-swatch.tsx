/**
 * Purpose: Color swatch component for the internal typography and brand guide.
 * Responsibilities: show a token name, hex value, and visual color chip.
 * Important notes: the color chip receives raw hex values from the preview page.
 */
import * as React from "react";

/**
 * Renders one labeled brand color sample.
 */
export function ColorSwatch({
  name,
  hex,
  className = "",
}: {
  name: string;
  hex: string;
  className?: string;
}) {
  return (
    <div
      className={
        "space-y-3 rounded-3xl border border-stone-200 bg-white/60 p-6 " +
        className
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-700">
            {name}
          </p>
          <p className="text-sm font-medium text-stone-600">{hex}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white/60 p-2">
          <div
            className="size-10 rounded-xl border border-black/5"
            style={{ background: hex }}
          />
        </div>
      </div>
    </div>
  );
}
