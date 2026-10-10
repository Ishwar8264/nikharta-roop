"use client";

import { cn } from "cn";
import {
  SliderFill,
  Slider as SliderPrimitive,
  SliderThumb,
  SliderTrack,
  type SliderProps as SliderPrimitiveProps,
} from "react-aria-components";

type SliderValue = number | number[];
type SliderProps<T extends SliderValue = SliderValue> = Omit<
  SliderPrimitiveProps<T>,
  "className"
> & {
  className?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  onValueChange?: (value: T) => void;
};

function Slider<T extends SliderValue = SliderValue>({
  className,
  min,
  max,
  disabled,
  onValueChange,
  ...props
}: SliderProps<T>) {
  return (
    <SliderPrimitive
      className={cn(
        "group relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col",
        className,
      )}
      data-slot="slider"
      {...props}
      minValue={min ?? props.minValue}
      maxValue={max ?? props.maxValue}
      isDisabled={disabled || props.isDisabled}
      onChange={onValueChange ?? props.onChange}
    >
      {({ state }) => {
        return (
          <>
            <SliderTrack
              data-slot="slider-track"
              className="relative grow rounded-full bg-muted select-none data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1"
            >
              <SliderFill
                data-slot="slider-range"
                className="absolute bg-primary select-none data-horizontal:h-full data-vertical:w-full"
              />
              {state.values.map((_, index) => (
                <SliderThumb
                  data-slot="slider-thumb"
                  key={index}
                  index={index}
                  className="absolute block size-3 shrink-0 rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow] select-none group-data-horizontal:top-[50%] group-data-vertical:left-[50%] after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50"
                />
              ))}
            </SliderTrack>
          </>
        );
      }}
    </SliderPrimitive>
  );
}

export { Slider };
