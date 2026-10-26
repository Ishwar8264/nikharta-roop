"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a debounced version of `callback`.
 *
 * Why a ref for the callback:
 * If `callback` is an inline arrow (new reference every render), a naive
 * effect would reset the timer on every parent render and the debounce
 * would never fire. The ref keeps the timer stable while always invoking
 * the latest callback closure.
 *
 * Why clear on unmount:
 * A pending timer that fires after the component is gone calls setState on
 * a dead tree. Clearing prevents the "cannot update unmounted component"
 * warning and stale writes.
 */
export function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delayMs: number,
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delayMs);
    },
    [delayMs],
  );
}
