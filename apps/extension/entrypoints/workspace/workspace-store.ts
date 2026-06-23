import { create } from "zustand";

import {
  saveTranslationHistoryRecords,
  type ContentFormat,
  type TranslationDirection,
  type TranslationHistoryRecord,
} from "./translation-history";

export type TranslationStatus = "idle" | "streaming" | "completed" | "failed";

export type WorkspaceState = {
  translationDirection: TranslationDirection;
  sourceContent: string;
  translationContent: string;
  sourceViewFormat: ContentFormat;
  translationViewFormat: ContentFormat;
  historyRecords: TranslationHistoryRecord[];
  translationStatus: TranslationStatus;
  setTranslationDirection: (translationDirection: TranslationDirection) => void;
  setSourceContent: (sourceContent: string) => void;
  setTranslationContent: (translationContent: string) => void;
  setSourceViewFormat: (sourceViewFormat: ContentFormat) => void;
  setTranslationViewFormat: (translationViewFormat: ContentFormat) => void;
  setTranslationStatus: (translationStatus: TranslationStatus) => void;
  hydrateHistoryRecords: (records: TranslationHistoryRecord[]) => void;
  prependHistoryRecord: (record: TranslationHistoryRecord) => Promise<void>;
  deleteHistoryRecord: (recordId: string) => Promise<void>;
  restoreHistoryRecord: (record: TranslationHistoryRecord) => void;
  resetWorkspaceStateForTests: () => void;
};

const initialWorkspaceValues = {
  translationDirection: "en-zh" as const,
  sourceViewFormat: "Markdown" as const,
  translationViewFormat: "Markdown" as const,
  historyRecords: [] as TranslationHistoryRecord[],
  translationStatus: "idle" as const,
};

export const sampleSource = `# Release notes

Kotoba keeps Markdown structure intact while translating prose.

- Preserve lists and headings
- Keep \`pnpm build\`, URLs, and API names unchanged
- Stream the result into the translation panel`;

export const sampleTranslation = `# 发布说明

Kotoba 会在翻译自然语言时保留 Markdown 结构。

- 保留列表和标题
- 保持 \`pnpm build\`、URL 和 API 名称不变
- 将结果流式显示在翻译面板中`;

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  translationDirection: initialWorkspaceValues.translationDirection,
  sourceContent: sampleSource,
  translationContent: sampleTranslation,
  sourceViewFormat: initialWorkspaceValues.sourceViewFormat,
  translationViewFormat: initialWorkspaceValues.translationViewFormat,
  historyRecords: initialWorkspaceValues.historyRecords,
  translationStatus: initialWorkspaceValues.translationStatus,
  setTranslationDirection: (translationDirection) => set({ translationDirection }),
  setSourceContent: (sourceContent) => set({ sourceContent }),
  setTranslationContent: (translationContent) => set({ translationContent }),
  setSourceViewFormat: (sourceViewFormat) => set({ sourceViewFormat }),
  setTranslationViewFormat: (translationViewFormat) => set({ translationViewFormat }),
  setTranslationStatus: (translationStatus) => set({ translationStatus }),
  hydrateHistoryRecords: (records) => set({ historyRecords: records }),
  prependHistoryRecord: async (record) => {
    let nextRecords: TranslationHistoryRecord[] = [];

    set((state) => {
      nextRecords = [record, ...state.historyRecords];

      return { historyRecords: nextRecords };
    });
    await saveTranslationHistoryRecords(nextRecords);
  },
  deleteHistoryRecord: async (recordId) => {
    let nextRecords: TranslationHistoryRecord[] = [];

    set((state) => {
      nextRecords = state.historyRecords.filter((record) => record.id !== recordId);

      return { historyRecords: nextRecords };
    });
    await saveTranslationHistoryRecords(nextRecords);
  },
  restoreHistoryRecord: (record) => set({
    translationDirection: record.translationDirection,
    sourceContent: record.sourceContent,
    translationContent: record.translatedContent,
    sourceViewFormat: record.sourceContentFormat,
    translationViewFormat: record.translationContentFormat,
    translationStatus: "completed",
  }),
  resetWorkspaceStateForTests: () => set({
    ...initialWorkspaceValues,
    sourceContent: sampleSource,
    translationContent: sampleTranslation,
  }),
}));
