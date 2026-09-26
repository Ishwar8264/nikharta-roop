import "server-only";

import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

import { AiProviderNotConfiguredError } from "../ai.errors";
import type { AiProvider } from "./provider.types";

/**
 * Resolves the active provider from environment variables.
 *
 * Why:
 * One env var (`AI_PROVIDER`) decides which vendor is live, and a second
 * (`AI_MODEL`) decides which model. Swapping from OpenAI to Anthropic is a
 * config change, not a code change. The registry pattern keeps every
 * provider in a small, self-contained factory below.
 */
const ACTIVE_PROVIDER_ID = process.env.AI_PROVIDER ?? "openai";
const ACTIVE_MODEL_ID = process.env.AI_MODEL ?? "gpt-4o-mini";

/**
 * OpenAI provider — active when OPENAI_API_KEY is present.
 *
 * Only this provider is wired today. The factory shape is what makes adding
 * Anthropic or Google a one-file change: import the SDK, register the
 * provider below, done.
 */
const openaiProvider: AiProvider = {
  id: "openai",
  isConfigured: () => Boolean(process.env.OPENAI_API_KEY),
  resolveModel: (modelId) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new AiProviderNotConfiguredError();
    const client = createOpenAI({ apiKey });
    return client(modelId);
  },
};

/** Registry of every known provider, keyed by id. */
const PROVIDERS: Record<string, AiProvider> = {
  openai: openaiProvider,
};

/**
 * Returns the configured provider based on `AI_PROVIDER`.
 *
 * Throws a typed error when the id is unknown or the selected provider is
 * missing credentials. The service layer surfaces this as a 503 so operators
 * can act on a config problem without paging the on-call engineer.
 */
export function getActiveProvider(): AiProvider {
  const provider = PROVIDERS[ACTIVE_PROVIDER_ID];
  if (!provider) throw new AiProviderNotConfiguredError();
  if (!provider.isConfigured()) throw new AiProviderNotConfiguredError();
  return provider;
}

/**
 * Returns the active `LanguageModel` ready for `streamText`.
 *
 * Why:
 * This is the single call site where the AI SDK is invoked from a non-provider
 * file. Everything else deals in strings, ids, and `TokenUsage` — the SDK
 * stays behind this boundary.
 */
export function getActiveModel(): LanguageModel {
  return getActiveProvider().resolveModel(ACTIVE_MODEL_ID);
}

/** Exposes the active model id for logging and usage records. */
export function getActiveModelId(): string {
  return ACTIVE_MODEL_ID;
}

/** Reports whether any AI provider can currently be reached. */
export function isAiConfigured(): boolean {
  return Boolean(PROVIDERS[ACTIVE_PROVIDER_ID]?.isConfigured());
}
