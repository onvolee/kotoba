import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";

import { type AISettings } from "./ai-settings";

export type AIConnectionResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

export async function testAIConnection(settings: AISettings): Promise<AIConnectionResult> {
  if (!settings.baseUrl || !settings.apiKey || !settings.model) {
    return { ok: false, error: "Missing settings" };
  }

  if (!isValidBaseUrl(settings.baseUrl)) {
    return { ok: false, error: "Invalid Base URL" };
  }

  try {
    await generateText({
      model: createOpenAICompatible({
        name: "user-provider",
        baseURL: settings.baseUrl,
        apiKey: settings.apiKey,
      }).chatModel(settings.model),
      prompt: 'Reply with "ok".',
    });

    return { ok: true };
  } catch (error) {
    return { ok: false, error: sanitizeConnectionError(error, settings.apiKey) };
  }
}

function isValidBaseUrl(baseUrl: string): boolean {
  try {
    const url = new URL(baseUrl);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeConnectionError(error: unknown, apiKey: string): string {
  const message = error instanceof Error ? error.message : "Unknown error";

  return message.replaceAll(apiKey, "[redacted]").replace(/Bearer\s+\S+/gi, "Bearer [redacted]");
}
