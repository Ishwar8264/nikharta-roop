import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The `coupon.service` module transitively loads `coupon.repository`, which
 * imports `@/lib/prisma`. That module throws at module load when
 * `DATABASE_URL` is unset (see `src/lib/prisma.ts`). Our unit under test —
 * `computeDiscount` — is pure: it doesn't touch the DB at all. Mocking the
 * prisma client here lets the service module load cleanly without dragging in
 * a real PrismaClient instantiation.
 *
 * Mocks are file-scoped: this test file is independent and shares no state.
 */
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { computeDiscount } from "../src/server/modules/coupon/coupon.service";

describe("computeDiscount", () => {
  // Reset the module registry between cases so no spy state leaks across
  // tests — even though this suite doesn't currently exercise the mock, the
  // guard keeps it future-proof.
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PERCENTAGE", () => {
    it("returns the percentage of the subtotal when below maxDiscount", () => {
      const result = computeDiscount(
        { discountType: "PERCENTAGE", discountValue: 10, maxDiscount: 100 },
        500,
      );
      // 10% of 500 = 50, which is below the 100 cap.
      expect(result).toBe(50);
    });

    it("caps the discount at maxDiscount when the raw amount exceeds it", () => {
      const result = computeDiscount(
        { discountType: "PERCENTAGE", discountValue: 20, maxDiscount: 50 },
        500,
      );
      // 20% of 500 = 100, capped at 50.
      expect(result).toBe(50);
    });

    it("does not cap when maxDiscount is null", () => {
      const result = computeDiscount(
        { discountType: "PERCENTAGE", discountValue: 25, maxDiscount: null },
        200,
      );
      // 25% of 200 = 50, no cap.
      expect(result).toBe(50);
    });

    it("never returns more than the subtotal", () => {
      const result = computeDiscount(
        { discountType: "PERCENTAGE", discountValue: 100, maxDiscount: null },
        300,
      );
      // 100% of 300 = 300 — equal, not exceeding.
      expect(result).toBe(300);

      // Even if the percentage somehow exceeds 100 (the create schema guards
      // against this at write time), the output is bounded by the subtotal.
      const overPct = computeDiscount(
        { discountType: "PERCENTAGE", discountValue: 200, maxDiscount: null },
        300,
      );
      expect(overPct).toBe(300);
    });

    it("returns 0 when discountValue is 0", () => {
      const result = computeDiscount(
        { discountType: "PERCENTAGE", discountValue: 0, maxDiscount: 50 },
        500,
      );
      expect(result).toBe(0);
    });
  });

  describe("FLAT", () => {
    it("returns the flat discount value when it is below the subtotal", () => {
      const result = computeDiscount(
        { discountType: "FLAT", discountValue: 100, maxDiscount: null },
        500,
      );
      expect(result).toBe(100);
    });

    it("is bounded by the subtotal when the flat value exceeds it", () => {
      const result = computeDiscount(
        { discountType: "FLAT", discountValue: 600, maxDiscount: null },
        500,
      );
      // Flat discount larger than the cart — discount cannot exceed the cart
      // total (a customer shouldn't be "owed" money by the salon).
      expect(result).toBe(500);
    });

    it("ignores maxDiscount entirely", () => {
      // For FLAT, maxDiscount is meaningless — the schema-level invariant
      // (maxDiscount >= discountValue for FLAT coupons) makes it redundant.
      const result = computeDiscount(
        { discountType: "FLAT", discountValue: 50, maxDiscount: 5 },
        500,
      );
      expect(result).toBe(50);
    });

    it("returns 0 when discountValue is 0", () => {
      const result = computeDiscount(
        { discountType: "FLAT", discountValue: 0, maxDiscount: null },
        500,
      );
      expect(result).toBe(0);
    });
  });

  describe("subtotal edge cases", () => {
    it("returns 0 when subtotal is 0", () => {
      expect(
        computeDiscount(
          { discountType: "PERCENTAGE", discountValue: 10, maxDiscount: null },
          0,
        ),
      ).toBe(0);
      expect(
        computeDiscount(
          { discountType: "FLAT", discountValue: 100, maxDiscount: null },
          0,
        ),
      ).toBe(0);
    });

    it("returns 0 when subtotal is negative", () => {
      expect(
        computeDiscount(
          { discountType: "PERCENTAGE", discountValue: 10, maxDiscount: null },
          -100,
        ),
      ).toBe(0);
      expect(
        computeDiscount(
          { discountType: "FLAT", discountValue: 50, maxDiscount: null },
          -100,
        ),
      ).toBe(0);
    });
  });

  describe("minOrderAmount", () => {
    it("is not enforced by computeDiscount — it is the caller's responsibility", () => {
      // `computeDiscount` takes only discountType/discountValue/maxDiscount +
      // subtotal. The minimum-order check lives in `evaluateCoupon` upstream
      // (see `coupon.service.ts`), which short-circuits before reaching here.
      // Asserting that this function still computes a discount for a below-min
      // subtotal documents that boundary explicitly.
      const result = computeDiscount(
        { discountType: "FLAT", discountValue: 50, maxDiscount: null },
        // Subtotal below any sensible minOrderAmount — still computed.
        10,
      );
      expect(result).toBe(10);
    });
  });
});
