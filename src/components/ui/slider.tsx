"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "cn";

/**
 * Accessible range slider built on Base UI.
 *
 * Why a thin wrapper:
 * Base UI's slider ships as separate primitives (Root/Control/Track/Indicator/Thumb);
 * the salon settings form (and any future numeric picker) wants one styled
 * component with the standard track+thumb look. The wrapper composes the
 * primitives once so the visual contract lives in one place.
 */
function Slider({
  className,
  ...props
}: SliderPrimitive.Root.Props<number>) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn("relative flex w-full items-center py-2", className)}
      {...props}
    >
      <SliderPrimitive.Control
        data-slot="slider-control"
        className="relative flex h-4 w-full touch-none items-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative h-1.5 grow rounded-full bg-muted"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-indicator"
            className="absolute h-full rounded-full bg-primary"
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          className="block size-4 rounded-full border border-primary bg-background shadow-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
        />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
