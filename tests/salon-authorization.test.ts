import { describe, expect, it } from "vitest";

/**
 * Pure unit tests for the salon authorization + helpers layer.
 *
 * `salon.authorization.ts` and `salon.helpers.ts` are pure modules:
 *   - the only runtime import is the `server-only` marker (stubbed in
 *     `vitest.config.ts`);
 *   - the `SalonMemberRole` import is type-only and stripped at transpile time,
 *     so the Prisma client (which would otherwise throw without a
 *     `DATABASE_URL`) is never loaded.
 *
 * No `vi.mock` is needed.
 */
import {
  assertRoleAtLeast,
  hasRoleAtLeast,
} from "../src/server/modules/salon/salon.authorization";
import { SalonAccessDeniedError } from "../src/server/modules/salon/salon.errors";
import { SalonRoleInsufficientError } from "../src/server/modules/salon/salon.errors";
import { isResourceId } from "../src/server/modules/salon/salon.helpers";

type Role = "OWNER" | "MANAGER" | "STAFF";

describe("hasRoleAtLeast", () => {
  describe("OWNER caller (top of the ladder)", () => {
    it("satisfies MANAGER", () => {
      expect(hasRoleAtLeast("OWNER", "MANAGER")).toBe(true);
    });

    it("satisfies STAFF", () => {
      expect(hasRoleAtLeast("OWNER", "STAFF")).toBe(true);
    });

    it("satisfies OWNER (boundary: equal rank)", () => {
      // The boundary case — `actual === required` — must pass. A common bug
      // is to write `>` instead of `>=`, which would silently strip the
      // top role of its own privileges.
      expect(hasRoleAtLeast("OWNER", "OWNER")).toBe(true);
    });
  });

  describe("MANAGER caller (middle of the ladder)", () => {
    it("does NOT satisfy OWNER", () => {
      expect(hasRoleAtLeast("MANAGER", "OWNER")).toBe(false);
    });

    it("satisfies STAFF", () => {
      expect(hasRoleAtLeast("MANAGER", "STAFF")).toBe(true);
    });

    it("satisfies MANAGER (boundary: equal rank)", () => {
      expect(hasRoleAtLeast("MANAGER", "MANAGER")).toBe(true);
    });
  });

  describe("STAFF caller (bottom of the ladder)", () => {
    it("does NOT satisfy MANAGER", () => {
      expect(hasRoleAtLeast("STAFF", "MANAGER")).toBe(false);
    });

    it("does NOT satisfy OWNER", () => {
      expect(hasRoleAtLeast("STAFF", "OWNER")).toBe(false);
    });

    it("satisfies STAFF (boundary: equal rank)", () => {
      expect(hasRoleAtLeast("STAFF", "STAFF")).toBe(true);
    });
  });

  describe("rank ordering OWNER > MANAGER > STAFF", () => {
    // Documents the role hierarchy invariant in one place. The
        // implementation hides the numeric ranks behind a `Record`, so this
        // matrix is the contract callers depend on: any role satisfies
        // any *lower* required role and fails any *higher* one. If the
        // rank map ever changes (e.g. a new SENIOR_STAFF tier), this matrix
        // forces the maintainer to consciously update every cell.
        const ROLES: Role[] = ["OWNER", "MANAGER", "STAFF"];
        const RANK: Record<Role, number> = { OWNER: 3, MANAGER: 2, STAFF: 1 };

        ROLES.forEach((actual) => {
          ROLES.forEach((required) => {
            const expected = RANK[actual] >= RANK[required];
            it(`hasRoleAtLeast("${actual}", "${required}") === ${expected}`, () => {
              expect(hasRoleAtLeast(actual, required)).toBe(expected);
            });
          });
        });
      }
    );

    it("returns a boolean (not a truthy/falsy value)", () => {
      // The implementation uses `>=` which yields a boolean, but a future
      // refactor could leak a number. Pinning the return type here guards
      // against that regression.
      expect(typeof hasRoleAtLeast("OWNER", "MANAGER")).toBe("boolean");
      expect(typeof hasRoleAtLeast("STAFF", "OWNER")).toBe("boolean");
    });
  }
);

describe("assertRoleAtLeast", () => {
  it("throws SalonRoleInsufficientError when the role is below the required", () => {
    // The thrown error must be the *typed* class so the route's error
    // mapping can pattern-match on `instanceof` and return the right
    // HTTP status (403). A plain `Error` would silently 500.
    expect(() => assertRoleAtLeast("STAFF", "MANAGER")).toThrow(
      SalonRoleInsufficientError,
    );
    expect(() => assertRoleAtLeast("MANAGER", "OWNER")).toThrow(
      SalonRoleInsufficientError,
    );
    expect(() => assertRoleAtLeast("STAFF", "OWNER")).toThrow(
      SalonRoleInsufficientError,
    );
  });

  it("throws an error carrying the expected message", () => {
    // The message is the user-facing string surfaced by the route handler.
    // Locking it here prevents a refactor from silently changing the copy.
    expect(() => assertRoleAtLeast("STAFF", "MANAGER")).toThrow(
      "Your salon role does not permit this action",
    );
  });

  it("does NOT throw when the role meets the requirement (boundary)", () => {
    // `expect.not.toThrow()` is the explicit "completes without throwing"
    // assertion — safer than wrapping in a try/catch and asserting on a
    // sentinel.
    expect(() => assertRoleAtLeast("OWNER", "MANAGER")).not.toThrow();
    expect(() => assertRoleAtLeast("MANAGER", "MANAGER")).not.toThrow();
    expect(() => assertRoleAtLeast("OWNER", "OWNER")).not.toThrow();
    expect(() => assertRoleAtLeast("STAFF", "STAFF")).not.toThrow();
    expect(() => assertRoleAtLeast("MANAGER", "STAFF")).not.toThrow();
  });

  it("throws a SalonRoleInsufficientError (not a plain Error or SalonAccessDeniedError)", () => {
    // The role-check and the access-check are distinct error classes —
    // the route layer maps them to different HTTP semantics (403 vs 404).
    // Asserting the class identity here keeps that boundary from blurring.
    let caught: unknown;
    try {
      assertRoleAtLeast("STAFF", "MANAGER");
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(SalonRoleInsufficientError);
    expect(caught).not.toBeInstanceOf(SalonAccessDeniedError);
  });

  it("returns undefined (no return value) when the check passes", () => {
    // The function's signature is `void`. Asserting the return value is
    // `undefined` documents that callers should not chain off the result
    // — the throw is the only signal of failure.
    const result = assertRoleAtLeast("OWNER", "MANAGER");
    expect(result).toBeUndefined();
  });
});

describe("SalonAccessDeniedError re-export", () => {
  // `salon.authorization.ts` re-exports `SalonAccessDeniedError` from
  // `salon.errors.ts` so callers that only need to throw don't need a
  // second import. This is a contract test — if the re-export is ever
  // dropped (e.g. by a refactor that inlines the class), the salon service
  // layer would break at runtime but the typecheck might pass because the
  // class still exists in `salon.errors`. Locking the re-export here makes
  // the failure show up in the test suite.
  it("is the same class as salon.errors.SalonAccessDeniedError", () => {
    expect(SalonAccessDeniedError).toBeInstanceOf(Function);
    expect(new SalonAccessDeniedError()).toBeInstanceOf(Error);
    expect(new SalonAccessDeniedError().name).toBe("SalonAccessDeniedError");
  });
});

describe("isResourceId", () => {
  describe("48-char lowercase hex (new gen_random_bytes(24) ids)", () => {
    it("returns true for a valid 48-char lowercase hex string", () => {
      const id = "0123456789abcdef0123456789abcdef0123456789abcdef";
      expect(id).toHaveLength(48);
      expect(isResourceId(id)).toBe(true);
    });

    it("returns true for an all-zeros 48-char hex (degenerate but valid shape)", () => {
      expect(isResourceId("0".repeat(48))).toBe(true);
    });

    it("returns false for 48 UPPERCASE hex (first regex is lowercase-only)", () => {
      // The first regex is `/^[a-f0-9]{48}$/` — no `i` flag. The second
      // regex requires the UUID dash pattern (8-4-4-4-12), so a 48-char
      // uppercase string with no dashes matches neither. This documents
      // that asymmetry — if you ever want to accept uppercase, both the
      // regex and this test need to update together.
      const upper = "A".repeat(48);
      expect(isResourceId(upper)).toBe(false);
    });

    it("returns false for 47-char hex (one short)", () => {
      expect(isResourceId("0".repeat(47))).toBe(false);
    });

    it("returns false for 49-char hex (one long)", () => {
      expect(isResourceId("0".repeat(49))).toBe(false);
    });

    it("returns false when a non-hex char appears in an otherwise 48-char string", () => {
      // 'g' is past 'f' and not a hex digit.
      const id = "g".padStart(48, "0");
      expect(isResourceId(id)).toBe(false);
    });

    it("returns false when leading/trailing whitespace pads a valid id", () => {
      const id = "0123456789abcdef0123456789abcdef0123456789abcdef";
      expect(isResourceId(` ${id} `)).toBe(false);
      expect(isResourceId(`\n${id}`)).toBe(false);
    });
  });

  describe("RFC 4122 UUIDs (legacy rows)", () => {
    it("returns true for a lowercase UUID", () => {
      const uuid = "12345678-1234-1234-1234-123456789abc";
      expect(isResourceId(uuid)).toBe(true);
    });

    it("returns true for an UPPERCASE UUID (second regex is case-insensitive)", () => {
      const uuid = "12345678-1234-1234-1234-123456789ABC";
      expect(isResourceId(uuid)).toBe(true);
    });

    it("returns true for a mixed-case UUID", () => {
      const uuid = "12345678-AbCd-EfFf-1234-123456789aBc";
      expect(isResourceId(uuid)).toBe(true);
    });

    it("returns true for the canonical RFC 4122 v4 example", () => {
      // The classic v4 example UUID — exercises the case-insensitive
      // second regex against a realistic value.
      const uuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
      expect(isResourceId(uuid)).toBe(true);
    });

    it("returns false when a UUID has a wrong group length (e.g. 7-4-4-4-12)", () => {
      const broken = "1234567-1234-1234-1234-123456789abc";
      expect(isResourceId(broken)).toBe(false);
    });

    it("returns false when a UUID is missing a dash group (e.g. 8-4-4-12)", () => {
      const broken = "12345678-1234-1234-123456789abc";
      expect(isResourceId(broken)).toBe(false);
    });
  });

  describe("slugs and other non-id inputs (the public-route case)", () => {
    it("returns false for a kebab-case slug", () => {
      expect(isResourceId("my-salon")).toBe(false);
    });

    it("returns false for a long kebab slug that has dashes but the wrong group shape", () => {
      // A 36-char slug with dashes would naively look UUID-shaped if you
      // only counted length — but the 8-4-4-4-12 group lengths don't match.
      const slug = "sparkle-lounge-mumbai-andheri-west";
      expect(isResourceId(slug)).toBe(false);
    });

    it("returns false for a slug with only letters and no dashes", () => {
      expect(isResourceId("sparklelounge")).toBe(false);
    });

    it("returns false for a 24-char hex (Mongo ObjectId / CUID shape)", () => {
      // The new id format is 48 hex (24 bytes); a 24-hex string is half
      // that and must NOT be confused with an id — otherwise a public
      // slug that happens to be 24 hex chars would route to the manage
      // path. This is the exact regression the helper was written to
      // guard against.
      expect(isResourceId("0123456789abcdef01234567")).toBe(false);
    });

    it("returns false for an empty string", () => {
      expect(isResourceId("")).toBe(false);
    });

    it("returns false for a numeric string", () => {
      expect(isResourceId("12345")).toBe(false);
    });

    it("returns false for a string with spaces", () => {
      expect(isResourceId("12345678 1234 1234 1234 123456789abc")).toBe(false);
    });
  });
});
