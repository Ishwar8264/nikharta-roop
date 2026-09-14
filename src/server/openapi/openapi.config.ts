import "server-only";

/**
 * Reports whether API documentation routes should be publicly available.
 *
 * Why:
 * Documentation is enabled by default for easy local testing but can be
 * disabled in production with `API_DOCS_ENABLED=false` without a code change.
 */
export function areApiDocsEnabled(): boolean {
  return process.env.API_DOCS_ENABLED !== "false";
}
