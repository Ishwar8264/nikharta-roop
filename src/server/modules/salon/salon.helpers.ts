import "server-only";

/**
 * Returns true when the value looks like a database id rather than a slug.
 *
 * Why:
 * Public detail routes are keyed by slug while management routes are keyed
 * by the internal id. Both shapes share the same URL prefix, so we detect
 * which one a caller sent instead of exposing two separate routes.
 *
 * Recognizes:
 *   - 48-character lowercase hex (new `gen_random_bytes(24)` ids).
 *   - RFC 4122 UUIDs (legacy rows created before the id migration).
 */
export function isResourceId(value: string): boolean {
  return (
    /^[a-f0-9]{48}$/.test(value) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}
