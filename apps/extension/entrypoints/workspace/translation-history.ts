import { storage } from "wxt/utils/storage";

export type TranslationDirection = "en-zh" | "zh-en";
export type ContentFormat = "Markdown" | "Plain text";
export type TranslationStylePreset = "Faithful" | "Natural" | "Polished";

export type TranslationHistoryRecord = {
  id: string;
  title: string;
  sourceContent: string;
  translatedContent: string;
  sourceContentFormat: ContentFormat;
  translationContentFormat: ContentFormat;
  translationDirection: TranslationDirection;
  stylePreset: TranslationStylePreset;
  baseUrl: string;
  model: string;
  createdAt: string;
};

export type HistoryStorageUsage = {
  bytes: number;
  recordCount: number;
  apiKeysInHistory: number;
  usageRatio: number;
};

const storageBudgetBytes = 50 * 1024 * 1024;
const translationHistoryKey = "local:translation-history";

export async function getSavedTranslationHistoryRecords(): Promise<TranslationHistoryRecord[]> {
  const value = await storage.getItem<unknown>(translationHistoryKey, {
    fallback: [],
  });

  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((record) => {
    const normalizedRecord = normalizeTranslationHistoryRecord(record);

    return normalizedRecord ? [normalizedRecord] : [];
  });
}

export async function saveTranslationHistoryRecords(records: TranslationHistoryRecord[]): Promise<TranslationHistoryRecord[]> {
  const recordsToSave = records.map(toPersistedHistoryRecord);

  await storage.setItem(translationHistoryKey, recordsToSave);
  return recordsToSave;
}

export function estimateHistoryStorageUsage(records: TranslationHistoryRecord[]): HistoryStorageUsage {
  const bytes = new TextEncoder().encode(JSON.stringify(records.map(toPersistedHistoryRecord))).byteLength;

  return {
    bytes,
    recordCount: records.length,
    apiKeysInHistory: countCredentialLeaks(records),
    usageRatio: Math.min(bytes / storageBudgetBytes, 1),
  };
}

export function estimateHistoryRecordStorageBytes(record: TranslationHistoryRecord): number {
  return new TextEncoder().encode(JSON.stringify(toPersistedHistoryRecord(record))).byteLength;
}

export function formatStorageBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kib = bytes / 1024;

  if (kib < 1024) {
    return `${kib.toFixed(1)} KB`;
  }

  return `${(kib / 1024).toFixed(1)} MB`;
}

function toPersistedHistoryRecord(record: TranslationHistoryRecord) {
  return {
    id: record.id,
    title: record.title,
    sourceContent: record.sourceContent,
    translatedContent: record.translatedContent,
    sourceContentFormat: record.sourceContentFormat,
    translationContentFormat: record.translationContentFormat,
    translationDirection: record.translationDirection,
    stylePreset: record.stylePreset,
    baseUrl: record.baseUrl,
    model: record.model,
    createdAt: record.createdAt,
  };
}

function normalizeTranslationHistoryRecord(value: unknown): TranslationHistoryRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const record = {
    id: readString(value.id),
    title: readString(value.title),
    sourceContent: readString(value.sourceContent),
    translatedContent: readString(value.translatedContent),
    sourceContentFormat: readContentFormat(value.sourceContentFormat),
    translationContentFormat: readContentFormat(value.translationContentFormat),
    translationDirection: readTranslationDirection(value.translationDirection),
    stylePreset: readTranslationStylePreset(value.stylePreset),
    baseUrl: readString(value.baseUrl),
    model: readString(value.model),
    createdAt: readString(value.createdAt),
  };

  if (
    !record.id
    || !record.title
    || !record.sourceContent
    || !record.translatedContent
    || !record.sourceContentFormat
    || !record.translationContentFormat
    || !record.translationDirection
    || !record.stylePreset
    || !record.createdAt
  ) {
    return null;
  }

  return {
    id: record.id,
    title: record.title,
    sourceContent: record.sourceContent,
    translatedContent: record.translatedContent,
    sourceContentFormat: record.sourceContentFormat,
    translationContentFormat: record.translationContentFormat,
    translationDirection: record.translationDirection,
    stylePreset: record.stylePreset,
    baseUrl: record.baseUrl,
    model: record.model,
    createdAt: record.createdAt,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readContentFormat(value: unknown): ContentFormat | null {
  return value === "Markdown" || value === "Plain text" ? value : null;
}

function readTranslationDirection(value: unknown): TranslationDirection | null {
  return value === "en-zh" || value === "zh-en" ? value : null;
}

function readTranslationStylePreset(value: unknown): TranslationStylePreset | null {
  return value === "Faithful" || value === "Natural" || value === "Polished" ? value : null;
}

function countCredentialLeaks(records: TranslationHistoryRecord[]): number {
  return records.filter((record) => JSON.stringify(toPersistedHistoryRecord(record)).match(/\bsk-[A-Za-z0-9_-]+/)).length;
}
