import { afterEach, describe, expect, it, vi } from "vitest";

import { translateSourceContent } from "./translation-service";

describe("OpenAI-compatible translation requests", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends disabled thinking in the HTTP request body", async () => {
    let requestBody: Record<string, unknown> | undefined;

    vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      requestBody = JSON.parse(String(init?.body));

      return new Response([
        "data: {\"id\":\"chunk-1\",\"object\":\"chat.completion.chunk\",\"created\":0,\"model\":\"qwen3.7-plus\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\"译文\"},\"finish_reason\":null}]}",
        "",
        "data: [DONE]",
        "",
      ].join("\n"), {
        status: 200,
        headers: {
          "content-type": "text/event-stream",
        },
      });
    }));

    const events = [];

    for await (const event of translateSourceContent({
      sourceContent: "Source text",
      sourceContentFormat: "Markdown",
      translationDirection: "en-zh",
      stylePrompt: "Translate naturally.",
      settings: {
        baseUrl: "https://api.example.com/v1",
        apiKey: "sk-test-key",
        model: "qwen3.7-plus",
        thinkingEnabled: false,
      },
    })) {
      events.push(event);
    }

    expect(requestBody).toMatchObject({
      model: "qwen3.7-plus",
      thinking: {
        type: "disabled",
      },
      stream: true,
    });
    expect(events).toEqual([{ type: "text", text: "译文" }]);
  });

  it("sends the configured thinking budget in the HTTP request body", async () => {
    let requestBody: Record<string, unknown> | undefined;

    vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      requestBody = JSON.parse(String(init?.body));

      return new Response([
        "data: {\"id\":\"chunk-1\",\"object\":\"chat.completion.chunk\",\"created\":0,\"model\":\"qwen3.7-plus\",\"choices\":[{\"index\":0,\"delta\":{\"reasoning_content\":\"分析\"},\"finish_reason\":null}]}",
        "",
        "data: {\"id\":\"chunk-2\",\"object\":\"chat.completion.chunk\",\"created\":0,\"model\":\"qwen3.7-plus\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\"译文\"},\"finish_reason\":null}]}",
        "",
        "data: [DONE]",
        "",
      ].join("\n"), {
        status: 200,
        headers: {
          "content-type": "text/event-stream",
        },
      });
    }));

    const events = [];

    for await (const event of translateSourceContent({
      sourceContent: "Source text",
      sourceContentFormat: "Markdown",
      translationDirection: "en-zh",
      stylePrompt: "Translate naturally.",
      settings: {
        baseUrl: "https://api.example.com/v1",
        apiKey: "sk-test-key",
        model: "qwen3.7-plus",
        thinkingEnabled: true,
      },
    })) {
      events.push(event);
    }

    expect(requestBody).toMatchObject({
      model: "qwen3.7-plus",
      thinking: {
        type: "enabled",
        budgetTokens: 8192,
      },
      stream: true,
    });
    expect(events).toEqual([
      { type: "thinking", text: "分析" },
      { type: "text", text: "译文" },
    ]);
  });
});
