"use client";

import { RouteError } from "@/components/shared/route-error";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Route-level boundary for the salon coupons manage page. */
export default function ManageCouponsError(props: ErrorProps) {
  return (
    <RouteError
      {...props}
      title="Could not load your coupons"
      message="Your coupon list did not load. Try again — your existing coupons and their usage counts are safe."
    />
  );
}
