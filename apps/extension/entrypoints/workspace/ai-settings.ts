import { storage } from "wxt/utils/storage";

export type AISettings = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

export type AIConnectionStatus = "not-tested" | "passed" | "failed";

export type SavedAISettings = AISettings & {
  connectionStatus: AIConnectionStatus;
};

const aiSettingsKey = "local:ai-settings";

const emptyAISettings: SavedAISettings = {
  baseUrl: "",
  apiKey: "",
  model: "",
  connectionStatus: "not-tested",
};

export async function getSavedAISettings(): Promise<SavedAISettings> {
  const value = await storage.getItem<Partial<SavedAISettings>>(aiSettingsKey, {
    fallback: emptyAISettings,
  });

  return normalizeAISettings(value);
}

export async function saveAISettings(settings: AISettings): Promise<SavedAISettings> {
  const currentSettings = await getSavedAISettings();
  const normalizedSettings = normalizeAISettings(settings);
  const settingsToSave = {
    ...normalizedSettings,
    connectionStatus: currentSettings.connectionStatus,
  };

  await storage.setItem(aiSettingsKey, settingsToSave);
  return settingsToSave;
}

export async function saveAIConnectionStatus(status: AIConnectionStatus): Promise<SavedAISettings> {
  const normalizedSettings = await getSavedAISettings();
  const settingsToSave = {
    ...normalizedSettings,
    connectionStatus: status,
  };

  await storage.setItem(aiSettingsKey, settingsToSave);
  return settingsToSave;
}

function normalizeAISettings(value: Partial<SavedAISettings> | null | undefined): SavedAISettings {
  return {
    baseUrl: normalizeBaseUrl(value?.baseUrl),
    apiKey: typeof value?.apiKey === "string" ? value.apiKey.trim() : "",
    model: typeof value?.model === "string" ? value.model.trim() : "",
    connectionStatus: isAIConnectionStatus(value?.connectionStatus) ? value.connectionStatus : "not-tested",
  };
}

function normalizeBaseUrl(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\/+$/, "");
}

function isAIConnectionStatus(value: unknown): value is AIConnectionStatus {
  return value === "not-tested" || value === "passed" || value === "failed";
}
