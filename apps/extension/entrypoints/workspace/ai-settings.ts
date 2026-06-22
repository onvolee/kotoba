import { storage } from "wxt/utils/storage";

export type AISettings = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

const aiSettingsKey = "local:ai-settings";

const emptyAISettings: AISettings = {
  baseUrl: "",
  apiKey: "",
  model: "",
};

export async function getSavedAISettings(): Promise<AISettings> {
  const value = await storage.getItem<Partial<AISettings>>(aiSettingsKey, {
    fallback: emptyAISettings,
  });

  return normalizeAISettings(value);
}

export async function saveAISettings(settings: AISettings): Promise<AISettings> {
  const normalizedSettings = normalizeAISettings(settings);
  await storage.setItem(aiSettingsKey, normalizedSettings);
  return normalizedSettings;
}

function normalizeAISettings(value: Partial<AISettings> | null | undefined): AISettings {
  return {
    baseUrl: normalizeBaseUrl(value?.baseUrl),
    apiKey: typeof value?.apiKey === "string" ? value.apiKey.trim() : "",
    model: typeof value?.model === "string" ? value.model.trim() : "",
  };
}

function normalizeBaseUrl(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\/+$/, "");
}
