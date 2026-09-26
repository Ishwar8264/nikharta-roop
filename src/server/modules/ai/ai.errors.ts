/** Thrown when a chat does not exist or is not visible to the caller. */
export class AiChatNotFoundError extends Error {
  constructor() {
    super("Chat not found");
    this.name = "AiChatNotFoundError";
  }
}

/** Thrown when the caller does not own the chat. */
export class AiChatAccessDeniedError extends Error {
  constructor() {
    super("You do not have access to this chat");
    this.name = "AiChatAccessDeniedError";
  }
}

/** Thrown when the caller has exhausted a quota dimension. */
export class AiQuotaExceededError extends Error {
  public readonly scope: "daily" | "weekly" | "monthly" | "blocked";
  public readonly limit: number;
  public readonly used: number;
  public readonly resetAt: Date | null;

  constructor(input: {
    scope: "daily" | "weekly" | "monthly" | "blocked";
    limit: number;
    used: number;
    resetAt: Date | null;
  }) {
    super(
      input.scope === "blocked"
        ? "Your AI access has been blocked by an administrator"
        : `AI ${input.scope} quota exceeded (${input.used}/${input.limit})`,
    );
    this.name = "AiQuotaExceededError";
    this.scope = input.scope;
    this.limit = input.limit;
    this.used = input.used;
    this.resetAt = input.resetAt;
  }
}

/** Thrown when no AI provider is configured via environment variables. */
export class AiProviderNotConfiguredError extends Error {
  constructor() {
    super(
      "AI provider is not configured. Set OPENAI_API_KEY or another provider key.",
    );
    this.name = "AiProviderNotConfiguredError";
  }
}

/** Thrown when the chat's contextType references a missing entity. */
export class AiInvalidContextError extends Error {
  constructor(message = "The referenced context entity does not exist") {
    super(message);
    this.name = "AiInvalidContextError";
  }
}

/** Thrown when the underlying model call fails unexpectedly. */
export class AiStreamingError extends Error {
  constructor(message = "AI response could not be generated") {
    super(message);
    this.name = "AiStreamingError";
  }
}
