/**
 * Empty stub for the `server-only` marker import.
 *
 * Why:
 * The real `server-only` package throws when imported in a non-RSC context,
 * to prevent server code from leaking into client bundles. Next.js replaces
 * the import at build time, so the package isn't listed as a dependency. In
 * Vitest we run in a plain Node environment where every module is server-side
 * by definition, so the marker is a no-op. See `vitest.config.ts` for the
 * alias that points `server-only` at this file.
 */
export {};
