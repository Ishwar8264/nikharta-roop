/**
 * Purpose: Client hook for OTP resend cooldown countdowns.
 * Responsibilities: normalize retry values, decrement once per second, and expose resettable cooldown state.
 * Important notes: invalid API values are clamped to zero so timer UI never shows NaN or negatives.
 */
"use client";

import * as React from "react";

/**
 * Normalizes API retry-after values into a safe non-negative second count.
 */
function getSafeCooldown(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/**
 * Runs a shared resend timer while callers decide when resending is allowed.
 */
export function useResendCooldown(initialRetryAfter: number) {
  const [cooldown, setCooldown] = React.useState(
    () => getSafeCooldown(initialRetryAfter),
  );

  // One timeout per second keeps the countdown simple and easy to reset.
  React.useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCooldown((currentCooldown) => Math.max(0, currentCooldown - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [cooldown]);

  return {
    cooldown,
    setCooldown,
  };
}
