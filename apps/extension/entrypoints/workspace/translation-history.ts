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

const primarySampleRecord: TranslationHistoryRecord = {
  id: "sample-api-migration",
  title: "API migration notes",
  sourceContent: `# API migration notes

The new translation service streams Markdown output directly into the workspace.

- Preserve code spans like \`streamText\`
- Keep endpoint names unchanged
- Save completed output to local history`,
  translatedContent: `# API 迁移说明

新的翻译服务会将 Markdown 输出直接流式写入工作区。

- 保留 \`streamText\` 等代码片段
- 保持端点名称不变
- 将完成的输出保存到本地历史`,
  sourceContentFormat: "Markdown",
  translationContentFormat: "Markdown",
  translationDirection: "en-zh",
  stylePreset: "Faithful",
  baseUrl: "http://101.43.64.125:8000/v1",
  model: "qwen3.7-plus",
  createdAt: "2026-06-22T08:30:00.000Z",
};

export const sampleHistoryRecords: TranslationHistoryRecord[] = [
  primarySampleRecord,
  ...Array.from({ length: 23 }, (_, index) => {
    const recordNumber = index + 2;

    return {
      ...primarySampleRecord,
      id: `sample-history-${recordNumber}`,
      title: `Markdown translation sample ${recordNumber}`,
      sourceContent: `# Markdown translation sample ${recordNumber}

This is seeded local history data for validating the virtualized history list.`,
      translatedContent: `# Markdown 翻译示例 ${recordNumber}

这是用于验证虚拟历史列表的本地历史测试数据。`,
      createdAt: new Date(Date.UTC(2026, 5, 22, 8, 30 - recordNumber)).toISOString(),
    };
  }),
];

export function estimateHistoryStorageUsage(records: TranslationHistoryRecord[]): HistoryStorageUsage {
  const bytes = new TextEncoder().encode(JSON.stringify(records.map(toPersistedHistoryRecord))).byteLength;

  return {
    bytes,
    recordCount: records.length,
    apiKeysInHistory: countCredentialLeaks(records),
    usageRatio: Math.min(bytes / storageBudgetBytes, 1),
  };
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

function countCredentialLeaks(records: TranslationHistoryRecord[]): number {
  return records.filter((record) => JSON.stringify(toPersistedHistoryRecord(record)).match(/\bsk-[A-Za-z0-9_-]+/)).length;
}
