/**
 * Browser-safe mirrors of `src/server/modules/ai/ai.types.ts`.
 *
 * Why duplicated:
 * The server module is `server-only` and pulls the Prisma client into its type
 * graph. Importing it from a Client Component would either crash the build
 * (runtime import) or drag server types into the browser bundle. A parallel
 * shape here lets the same props flow across the server/client boundary
 * without the Prisma dependency.
 *
 * `Date` → `string`:
 * The server returns `Date` instances; `NextResponse.json` serializes them to
 * ISO strings. By the time the data reaches a Client Component (via props or
 * fetch), the values are strings. Server Components that pre-render the panel
 * convert with `.toISOString()` before passing props.
 *
 * Shapes MUST stay in sync with the server module — when the server's
 * `PublicChat` / `PublicMessage` / `AiUsageSummary` gain a field, the matching
 * mirror here must gain it too.
 */

/** The four context types the schema recognizes. Mirrors `AiContextType`. */
export type AiContextType = "GENERAL" | "STAFF" | "PRODUCT" | "SERVICE";

/** Public shape of a chat. */
export interface PublicChat {
  id: string;
  title: string | null;
  contextType: AiContextType;
  contextId: string | null;
  createdAt: string;
}

/** Public shape of a message. */
export interface PublicMessage {
  id: string;
  /** `"user"` | `"assistant"` — kept as a string to mirror the server shape. */
  role: string;
  content: string;
  tokens: number;
  createdAt: string;
}

/** Chat with its full message history. */
export interface PublicChatWithMessages {
  chat: PublicChat;
  messages: PublicMessage[];
}

/** Cursor-paginated chat list. */
export interface PaginatedChats {
  items: PublicChat[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** One quota window (daily / weekly / monthly). */
export interface AiUsageWindow {
  used: number;
  limit: number;
  resetAt: string;
}

/** Quota summary returned to the client. */
export interface AiUsageSummary {
  isBlocked: boolean;
  blockReason: string | null;
  daily: AiUsageWindow;
  weekly: AiUsageWindow;
  monthly: AiUsageWindow;
}

/**
 * Returns true when the caller has exhausted any quota window or is blocked.
 *
 * Why centralize:
 * The panel disables the composer under three conditions — `isBlocked`,
 * daily quota hit, and (defensively) a zero-limit window. Coalescing them
 * here keeps the gate readable at the call site and gives one place to update
 * if the rule changes.
 */
export function isUsageExhausted(usage: AiUsageSummary): boolean {
  if (usage.isBlocked) return true;
  const windows = [usage.daily, usage.weekly, usage.monthly];
  return windows.some((w) => w.limit > 0 && w.used >= w.limit);
}
