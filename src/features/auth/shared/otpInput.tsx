"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

interface OtpInputProps {
  /** Current value, any length up to `length`. */
  value: string;
  onChange: (value: string) => void;
  /** Number of digit boxes. Default 6 to match the backend schema. */
  length?: number;
  disabled?: boolean;
  /** Renders boxes with the destructive ring when true. */
  invalid?: boolean;
  autoFocus?: boolean;
}

/**
 * Six-box OTP input.
 *
 * Why six separate inputs, not one:
 * Single-input OTPs force the user to count digits manually. Six boxes make
 * the expected length obvious and let autofill (iOS/Android SMS/email OTP
 * suggestions) drop the code in one gesture.
 *
 * Why a hidden "real" input pattern isn't used:
 * It requires a focus trap that breaks paste on some browsers. Six inputs
 * with explicit focus management is more code but behaves predictably across
 * platforms and screen readers.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled,
  invalid,
  autoFocus,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  /** Digits only, capped at `length`. */
  function sanitize(input: string): string {
    return input.replace(/\D/g, "").slice(0, length);
  }

  function handleChange(index: number, raw: string) {
    const digits = sanitize(raw);
    const chars = value.split("");

    // Handle a paste that lands in a single box: distribute across all boxes.
    if (digits.length > 1) {
      onChange(digits);
      focusAt(Math.min(digits.length, length - 1));
      return;
    }

    chars[index] = digits;
    const next = chars.join("").slice(0, length);
    onChange(next);

    if (digits && index < length - 1) focusAt(index + 1);
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      e.preventDefault();
      const chars = value.split("");
      chars[index - 1] = "";
      onChange(chars.join(""));
      focusAt(index - 1);
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusAt(index - 1);
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      focusAt(index + 1);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = sanitize(e.clipboardData.getData("text"));
    if (!pasted) return;

    e.preventDefault();
    onChange(pasted);
    focusAt(Math.min(pasted.length, length - 1));
  }

  function focusAt(index: number) {
    const el = refs.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  }

  return (
    <div
      className="grid grid-cols-6 gap-2"
      role="group"
      aria-label="One-time code"
    >
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={length} // allow paste into one box
          value={value[index] ?? ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={invalid ? true : undefined}
          className={cn(
            "h-11 w-full min-w-0 rounded-none border border-input bg-background text-center text-lg font-semibold",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            invalid && "border-destructive focus-visible:ring-destructive",
          )}
        />
      ))}
    </div>
  );
}
