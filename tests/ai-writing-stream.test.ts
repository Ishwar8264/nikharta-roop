import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendMessages } = vi.hoisted(() => ({ sendMessages: vi.fn() }));

vi.mock("ai", () => ({
  generateId: () => "message-id",
  DefaultChatTransport: class {
    sendMessages = sendMessages;
  },
}));
vi.mock("../src/lib/api/backend.client", () => ({ api: {}, refreshSession: vi.fn() }));

import { sendMessageApi } from "../src/features/ai/api";

function stream(chunks: unknown[]) {
  const result = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
  sendMessages.mockResolvedValue(result);
  return result;
}

describe("AI writing stream", () => {
  beforeEach(() => vi.clearAllMocks());

  it("collects text and forwards cancellation to the transport", async () => {
    const result = stream([
      { type: "start" },
      { type: "text-delta", delta: "Welcome " },
      { type: "text-delta", delta: "to our salon." },
    ]);
    const controller = new AbortController();
    await expect(sendMessageApi("chat-id", "Write a description", { signal: controller.signal }))
      .resolves.toBe("Welcome to our salon.");
    expect(sendMessages).toHaveBeenCalledWith(expect.objectContaining({ abortSignal: controller.signal }));
    expect(result.locked).toBe(false);
  });

  it("rejects partial drafts when the provider reports an error", async () => {
    const result = stream([
      { type: "text-delta", delta: "Incomplete draft" },
      { type: "error", errorText: "Provider unavailable" },
    ]);
    await expect(sendMessageApi("chat-id", "Write")).rejects.toThrow("Provider unavailable");
    expect(result.locked).toBe(false);
  });

  it("rejects interrupted generations", async () => {
    stream([{ type: "text-delta", delta: "Partial" }, { type: "abort" }]);
    await expect(sendMessageApi("chat-id", "Write")).rejects.toThrow("interrupted");
  });
});
