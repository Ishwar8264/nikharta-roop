"use client";

import * as React from "react";

// API values are treated defensively so timer UI never starts negative/NaN.
function getSafeCooldown(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

// Shared resend timer; callers only decide when a resend is allowed.
export function useResendCooldown(initialRetryAfter: number) {
  const [cooldown, setCooldown] = React.useState(
    getSafeCooldown(initialRetryAfter),
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
