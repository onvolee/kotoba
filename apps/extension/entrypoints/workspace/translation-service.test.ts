import { describe, expect, it, vi } from "vitest";

import { translateSourceContent } from "./translation-service";

const aiMocks = vi.hoisted(() => ({
  chatModel: vi.fn((model: string) => ({ model })),
  createOpenAICompatible: vi.fn(() => ({
    chatModel: aiMocks.chatModel,
  })),
  streamText: vi.fn(),
}));

vi.mock("@ai-sdk/openai-compatible", () => ({
  createOpenAICompatible: aiMocks.createOpenAICompatible,
}));

vi.mock("ai", () => ({
  streamText: aiMocks.streamText,
}));

describe("translation service", () => {
  it("streams translated text from the configured OpenAI-compatible provider", async () => {
    aiMocks.streamText.mockReturnValue({
      textStream: toAsyncIterable(["# 标题\n\n", "正文"]),
    });

    const chunks: string[] = [];

    for await (const chunk of translateSourceContent({
      sourceContent: "# Title",
      sourceContentFormat: "Markdown",
      translationDirection: "en-zh",
      stylePreset: "Faithful",
      settings: {
        baseUrl: "http://101.43.64.125:8000/v1",
        apiKey: "sk-sub-g33qmnkpch841r4emuyy5tug",
        model: "qwen3.7-plus",
      },
    })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(["# 标题\n\n", "正文"]);
    expect(aiMocks.createOpenAICompatible).toHaveBeenCalledWith({
      name: "user-provider",
      baseURL: "http://101.43.64.125:8000/v1",
      apiKey: "sk-sub-g33qmnkpch841r4emuyy5tug",
    });
    expect(aiMocks.chatModel).toHaveBeenCalledWith("qwen3.7-plus");
    expect(aiMocks.streamText).toHaveBeenCalledWith(expect.objectContaining({
      prompt: "# Title",
      system: expect.stringContaining("Translate English to Simplified Chinese."),
    }));
  });
});

async function* toAsyncIterable(chunks: string[]) {
  for (const chunk of chunks) {
    yield chunk;
  }
}
