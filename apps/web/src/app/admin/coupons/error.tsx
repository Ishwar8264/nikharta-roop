"use client";

import { RouteError } from "@/components/shared/route-error";

/** Admin coupons error boundary. */
export default function AdminCouponsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="Couldn't load coupons"
      message="We couldn't fetch the coupon list. Try again — if it keeps failing, the admin team has been notified."
    />
  );
}
