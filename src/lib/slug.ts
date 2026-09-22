import "server-only";

/**
 * Converts an arbitrary string into a URL-safe slug.
 *
 * Why:
 * Slugs are derived from human input (salon names) and must be stable,
 * lowercase, and free of punctuation so they can appear in URLs unchanged.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Generates a unique slug by probing the database for collisions.
 *
 * Why:
 * Two salons can share a name (e.g. "Glamour Studio" in different cities).
 * Appending a numeric suffix keeps every slug unique without leaking DB ids
 * or requiring a retry loop in the caller.
 *
 * The `exists` callback is injected so this helper stays testable and does
 * not import Prisma directly.
 */
export async function generateUniqueSlug(
  base: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const normalized = slugify(base) || "salon";

  if (!(await exists(normalized))) {
    return normalized;
  }

  // Try a bounded range of suffixes; the caller fails loudly if all are taken.
  for (let suffix = 2; suffix <= 100; suffix += 1) {
    const suffixText = `-${suffix}`;
    const candidate = `${normalized.slice(0, 80 - suffixText.length)}${suffixText}`;
    if (!(await exists(candidate))) {
      return candidate;
    }
  }

  throw new Error(
    `Unable to generate a unique slug for "${base}" after 100 attempts`,
  );
}
