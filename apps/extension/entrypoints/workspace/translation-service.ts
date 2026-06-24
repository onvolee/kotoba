import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText } from "ai";

import { type AISettings } from "./ai-settings";
import { type ContentFormat, type TranslationDirection, type TranslationStylePreset } from "./translation-history";

export type TranslateSourceContentOptions = {
  sourceContent: string;
  sourceContentFormat: ContentFormat;
  translationDirection: TranslationDirection;
  stylePreset: TranslationStylePreset;
  settings: AISettings;
  abortSignal?: AbortSignal;
};

export type TranslationStreamEvent =
  | { type: "text"; text: string }
  | { type: "thinking"; text: string };

export async function* translateSourceContent(options: TranslateSourceContentOptions): AsyncIterable<TranslationStreamEvent> {
  if (!hasCompleteAISettings(options.settings)) {
    throw new Error("Missing AI provider settings");
  }

  const result = streamText({
    model: createOpenAICompatible({
      name: "user-provider",
      baseURL: options.settings.baseUrl,
      apiKey: options.settings.apiKey,
    }).chatModel(options.settings.model),
    system: buildTranslationSystemPrompt(options),
    prompt: options.sourceContent,
    providerOptions: options.settings.thinkingEnabled
      ? {
          openaiCompatible: {
            reasoningEffort: "medium",
          },
        }
      : undefined,
    abortSignal: options.abortSignal,
  });

  for await (const part of result.fullStream) {
    if (part.type === "reasoning-delta") {
      yield { type: "thinking", text: part.text };
    }

    if (part.type === "text-delta") {
      yield { type: "text", text: part.text };
    }
  }
}

function hasCompleteAISettings(settings: AISettings): boolean {
  return Boolean(settings.baseUrl && settings.apiKey && settings.model);
}

function buildTranslationSystemPrompt(options: TranslateSourceContentOptions): string {
  const direction = options.translationDirection === "en-zh"
    ? "Translate English to Simplified Chinese."
    : "Translate Simplified Chinese to English.";

  return [
    "You are Kotoba, a precise document translation engine.",
    direction,
    `Use a ${options.stylePreset.toLowerCase()} translation style.`,
    `The source content format is ${options.sourceContentFormat}.`,
    "Preserve Markdown structure, headings, lists, tables, links, URLs, inline code, fenced code blocks, commands, API names, and placeholders.",
    "Return only the translated content. Do not add explanations.",
  ].join("\n");
}
