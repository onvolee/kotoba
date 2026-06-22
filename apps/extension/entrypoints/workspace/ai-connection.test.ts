import { beforeEach, describe, expect, it, vi } from "vitest";

import { testAIConnection } from "./ai-connection";

const aiMocks = vi.hoisted(() => ({
  generateText: vi.fn(),
}));

vi.mock("ai", () => ({
  generateText: aiMocks.generateText,
}));

vi.mock("@ai-sdk/openai-compatible", () => ({
  createOpenAICompatible: vi.fn(() => ({
    chatModel: vi.fn((model: string) => model),
  })),
}));

describe("AI provider connection", () => {
  beforeEach(() => {
    aiMocks.generateText.mockReset();
  });

  it("does not expose API keys or authorization headers in failed connection results", async () => {
    aiMocks.generateText.mockRejectedValue(new Error("Provider rejected Authorization: Bearer sk-secret-key"));

    const result = await testAIConnection({
      baseUrl: "https://api.example.com/v1",
      apiKey: "sk-secret-key",
      model: "example-chat",
    });

    expect(result).toEqual({
      ok: false,
      error: "Provider rejected Authorization: Bearer [redacted]",
    });
  });

  it("rejects invalid Base URLs before sending a provider request", async () => {
    const result = await testAIConnection({
      baseUrl: "api.example.com/v1",
      apiKey: "sk-secret-key",
      model: "example-chat",
    });

    expect(result).toEqual({
      ok: false,
      error: "Invalid Base URL",
    });
    expect(aiMocks.generateText).not.toHaveBeenCalled();
  });
});
