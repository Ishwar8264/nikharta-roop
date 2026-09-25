import "server-only";

import type { LanguageModel } from "ai";

/**
 * Contract every AI provider implements.
 *
 * Why:
 * The registry returns a `LanguageModel` — the AI SDK's runtime object —
 * rather than a raw SDK client. That keeps the service layer decoupled from
 * any specific vendor: today OpenAI, tomorrow Anthropic or Google, with zero
 * changes above the provider boundary.
 *
 * `isConfigured()` is the env gate. When the matching API key is missing,
 * the provider is registered but inert, and the service throws a typed
 * `AiProviderNotConfiguredError` instead of a stack trace at import time.
 */
export interface AiProvider {
  /** Short identifier used in env config, e.g. "openai". */
  id: string;
  /** True when the environment has everything needed to call the provider. */
  isConfigured: () => boolean;
  /**
   * Resolves a model id (e.g. "gpt-4o-mini") to a `LanguageModel` instance.
   * Only called when `isConfigured()` is true.
   */
  resolveModel: (modelId: string) => LanguageModel;
}
