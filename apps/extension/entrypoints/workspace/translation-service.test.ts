import { beforeEach, describe, expect, it, vi } from "vitest";

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
  beforeEach(() => {
    aiMocks.chatModel.mockClear();
    aiMocks.createOpenAICompatible.mockClear();
    aiMocks.streamText.mockReset();
  });

  it("streams translated text from the configured OpenAI-compatible provider", async () => {
    aiMocks.streamText.mockReturnValue({
      fullStream: toAsyncIterable([
        { type: "reasoning-delta", text: "Provider reasoning that should stay hidden." },
        { type: "text-delta", text: "# 标题\n\n" },
        { type: "text-delta", text: "正文" },
      ]),
    });

    const chunks: string[] = [];

    for await (const event of translateSourceContent({
      sourceContent: "# Title",
      sourceContentFormat: "Markdown",
      translationDirection: "en-zh",
      stylePrompt: "Use technical translation rules.",
      settings: {
        baseUrl: "https://api.example.com/v1",
        apiKey: "sk-test-key",
        model: "example-chat",
      },
    })) {
      chunks.push(event.text);
    }

    expect(chunks).toEqual(["# 标题\n\n", "正文"]);
    expect(aiMocks.createOpenAICompatible).toHaveBeenCalledWith({
      name: "user-provider",
      baseURL: "https://api.example.com/v1",
      apiKey: "sk-test-key",
    });
    expect(aiMocks.chatModel).toHaveBeenCalledWith("example-chat");
    expect(aiMocks.streamText).toHaveBeenCalledWith(expect.objectContaining({
      prompt: "# Title",
      providerOptions: {
        openaiCompatible: {
          reasoningEffort: "none",
        },
      },
      system: expect.stringMatching(/Translate English to Simplified Chinese.[\s\S]*Use technical translation rules./),
    }));
  });

  it("streams model thinking separately when thinking mode is enabled", async () => {
    aiMocks.streamText.mockReturnValue({
      fullStream: toAsyncIterable([
        { type: "reasoning-delta", text: "Checking the Markdown structure." },
        { type: "text-delta", text: "# 标题" },
      ]),
    });

    const events = [];

    for await (const event of translateSourceContent({
      sourceContent: "# Title",
      sourceContentFormat: "Markdown",
      translationDirection: "en-zh",
      stylePrompt: "Use technical translation rules.",
      settings: {
        baseUrl: "https://api.example.com/v1",
        apiKey: "sk-test-key",
        model: "example-chat",
        thinkingEnabled: true,
      },
    })) {
      events.push(event);
    }

    expect(events).toEqual([
      { type: "thinking", text: "Checking the Markdown structure." },
      { type: "text", text: "# 标题" },
    ]);
    expect(aiMocks.streamText).toHaveBeenCalledWith(expect.objectContaining({
      providerOptions: {
        openaiCompatible: {
          reasoningEffort: "medium",
        },
      },
    }));
  });

  it("rejects missing provider settings before starting a stream", async () => {
    await expect(async () => {
      for await (const _chunk of translateSourceContent({
        sourceContent: "# Title",
        sourceContentFormat: "Markdown",
        translationDirection: "en-zh",
        stylePrompt: "Use technical translation rules.",
        settings: {
          baseUrl: "",
          apiKey: "",
          model: "",
        },
      })) {
        // Exhaust the stream to surface generator errors.
      }
    }).rejects.toThrow("Missing AI provider settings");

    expect(aiMocks.createOpenAICompatible).not.toHaveBeenCalled();
    expect(aiMocks.streamText).not.toHaveBeenCalled();
  });
});

async function* toAsyncIterable(chunks: Array<{ type: string; text: string }>) {
  for (const chunk of chunks) {
    yield chunk;
  }
}
