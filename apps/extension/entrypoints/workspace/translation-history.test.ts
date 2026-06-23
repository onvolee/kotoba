import { describe, expect, it } from "vitest";

import { estimateHistoryStorageUsage, formatStorageBytes, type TranslationHistoryRecord } from "./translation-history";

describe("translation history storage usage", () => {
  it("estimates storage from history text and metadata without storing API keys", () => {
    const records: TranslationHistoryRecord[] = [
      {
        id: "history-1",
        title: "Release notes",
        sourceContent: "# Release notes",
        translatedContent: "# 发布说明",
        sourceContentFormat: "Markdown",
        translationContentFormat: "Markdown",
        translationDirection: "en-zh",
        stylePreset: "Faithful",
        baseUrl: "https://api.example.com/v1",
        model: "qwen3.7-plus",
        createdAt: "2026-06-22T08:30:00.000Z",
      },
    ];

    const usage = estimateHistoryStorageUsage(records);

    expect(usage.recordCount).toBe(1);
    expect(usage.bytes).toBeGreaterThan("# Release notes# 发布说明".length);
    expect(usage.apiKeysInHistory).toBe(0);
    expect(usage.usageRatio).toBeGreaterThan(0);
    expect(usage.usageRatio).toBeLessThan(1);
  });

  it("formats storage byte counts for settings display", () => {
    expect(formatStorageBytes(512)).toBe("512 B");
    expect(formatStorageBytes(1536)).toBe("1.5 KB");
    expect(formatStorageBytes(2 * 1024 * 1024)).toBe("2.0 MB");
  });
});
