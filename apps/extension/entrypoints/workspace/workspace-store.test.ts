import { beforeEach, describe, expect, it } from "vitest";
import { fakeBrowser } from "wxt/testing";

import { useWorkspaceStore } from "./workspace-store";
import {
  getSavedTranslationHistoryRecords,
  saveTranslationHistoryRecords,
  type TranslationHistoryRecord,
} from "./translation-history";

describe("workspace store", () => {
  beforeEach(() => {
    fakeBrowser.reset();
    useWorkspaceStore.getState().resetWorkspaceStateForTests();
  });

  it("restores a history record into completed workspace state", () => {
    const record = createHistoryRecord();

    useWorkspaceStore.getState().restoreHistoryRecord(record);

    expect(useWorkspaceStore.getState().sourceContent).toBe(record.sourceContent);
    expect(useWorkspaceStore.getState().translationContent).toBe(record.translatedContent);
    expect(useWorkspaceStore.getState().translationStatus).toBe("completed");
  });

  it("deletes a history record by id", () => {
    const record = createHistoryRecord({ id: "history-delete" });

    useWorkspaceStore.getState().resetWorkspaceStateForTests();
    useWorkspaceStore.getState().prependHistoryRecord(record);
    useWorkspaceStore.getState().deleteHistoryRecord(record.id);

    expect(useWorkspaceStore.getState().historyRecords).toEqual([]);
  });

  it("keeps history records available after the workspace store is reset and hydrated", async () => {
    const record = createHistoryRecord({
      id: "history-reload",
      title: "Reloaded translation",
    });

    await useWorkspaceStore.getState().prependHistoryRecord(record);
    useWorkspaceStore.getState().resetWorkspaceStateForTests();
    useWorkspaceStore.getState().hydrateHistoryRecords(await getSavedTranslationHistoryRecords());

    expect(useWorkspaceStore.getState().historyRecords).toEqual([record]);
  });

  it("removes deleted history records from saved history", async () => {
    const record = createHistoryRecord({ id: "history-delete" });
    await saveTranslationHistoryRecords([record]);
    useWorkspaceStore.getState().hydrateHistoryRecords([record]);

    await useWorkspaceStore.getState().deleteHistoryRecord(record.id);

    await expect(getSavedTranslationHistoryRecords()).resolves.toEqual([]);
  });
});

function createHistoryRecord(overrides: Partial<TranslationHistoryRecord> = {}): TranslationHistoryRecord {
  return {
    id: "history-record",
    title: "Release notes",
    sourceContent: "# Release notes",
    translatedContent: "# 发布说明",
    sourceContentFormat: "Markdown",
    translationContentFormat: "Markdown",
    translationDirection: "en-zh",
    stylePromptName: "Programming technology",
    baseUrl: "https://api.example.com/v1",
    model: "example-chat",
    createdAt: "2026-06-23T07:12:00.000Z",
    ...overrides,
  };
}
