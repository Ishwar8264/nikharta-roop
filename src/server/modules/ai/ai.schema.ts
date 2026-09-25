import { z } from "zod";

import { resourceIdSchema } from "@/server/modules/salon/salon.schema";

/**
 * The four context types the schema recognizes.
 *
 * Why:
 * Context drives the system prompt injected server-side. `GENERAL` chats
 * have no attached entity; the other three require a matching `contextId`.
 */
const contextTypeSchema = z.enum(["GENERAL", "STAFF", "PRODUCT", "SERVICE"], {
  error: "Context type is invalid",
});

/**
 * Body for creating a chat.
 *
 * Why:
 * The refine enforces that non-GENERAL contexts carry an id — otherwise the
 * server would have no way to build a meaningful system prompt and the chat
 * would silently behave like GENERAL while claiming otherwise.
 */
export const createChatSchema = z
  .strictObject({
    title: z
      .string({ error: "Title must be a string" })
      .trim()
      .max(120, "Title must contain at most 120 characters")
      .optional(),
    contextType: contextTypeSchema.default("GENERAL"),
    contextId: resourceIdSchema.optional(),
  })
  .refine(
    (input) =>
      input.contextType === "GENERAL"
        ? input.contextId === undefined
        : Boolean(input.contextId),
    {
      message:
        "contextId is required for non-GENERAL contexts and forbidden for GENERAL",
      path: ["contextId"],
    },
  );

/** Chat listing query. */
export const listChatsQuerySchema = z.strictObject({
  cursor: z
    .string({ error: "Cursor must be a string" })
    .pipe(resourceIdSchema)
    .optional(),
  limit: z.coerce
    .number({ error: "Limit must be a number" })
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(50, "Limit must be at most 50")
    .default(20),
});

/**
 * Partial chat update.
 *
 * Why:
 * Only `title` is editable. Changing `contextType`/`contextId` after
 * messages exist would silently rewrite the system prompt mid-conversation,
 * so those fields are intentionally immutable.
 */
export const updateChatSchema = z.strictObject({
  title: z
    .string({ error: "Title must be a string" })
    .trim()
    .min(1, "Title must not be empty")
    .max(120, "Title must contain at most 120 characters"),
});

/**
 * Message body for the streaming endpoint.
 *
 * Why:
 * The Vercel AI SDK `useChat` hook sends the full `UIMessage[]` array on
 * every request. We accept that shape, convert to model messages server-side,
 * and persist only the last two entries. `chatId` is in the URL, not the body.
 */
export const sendMessageSchema = z.strictObject({
  messages: z
    .array(
      z
        .object({
          id: z.string({ error: "Message id must be a string" }).optional(),
          role: z.enum(["user", "assistant", "system"], {
            error: "Role must be user, assistant, or system",
          }),
          parts: z
            .array(z.unknown(), { error: "Parts must be an array" })
            .optional(),
          content: z.string().optional(),
        })
        .refine((input) => Boolean(input.parts || input.content), {
          message: "Message must include either `parts` or `content`",
        }),
      { error: "messages must be an array" },
    )
    .min(1, "At least one message is required")
    .max(100, "At most 100 messages are allowed"),
});

/** URL params for chat detail and messages routes. */
export const chatIdParamSchema = z.strictObject({
  chatId: resourceIdSchema,
});
