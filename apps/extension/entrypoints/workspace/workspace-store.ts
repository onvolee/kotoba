import { create } from "zustand";

import {
  saveTranslationHistoryRecords,
  type ContentFormat,
  type TranslationDirection,
  type TranslationHistoryRecord,
} from "./translation-history";

export type TranslationStatus = "idle" | "streaming" | "completed" | "failed" | "stopped";

export type WorkspaceState = {
  translationDirection: TranslationDirection;
  sourceContent: string;
  translationContent: string;
  translationThinkingContent: string;
  sourceViewFormat: ContentFormat;
  translationViewFormat: ContentFormat;
  historyRecords: TranslationHistoryRecord[];
  translationStatus: TranslationStatus;
  setTranslationDirection: (translationDirection: TranslationDirection) => void;
  setSourceContent: (sourceContent: string) => void;
  setTranslationContent: (translationContent: string) => void;
  setTranslationThinkingContent: (translationThinkingContent: string) => void;
  setSourceViewFormat: (sourceViewFormat: ContentFormat) => void;
  setTranslationViewFormat: (translationViewFormat: ContentFormat) => void;
  setTranslationStatus: (translationStatus: TranslationStatus) => void;
  clearSourceContent: () => void;
  clearTranslationContent: () => void;
  hydrateHistoryRecords: (records: TranslationHistoryRecord[]) => void;
  prependHistoryRecord: (record: TranslationHistoryRecord) => Promise<void>;
  deleteHistoryRecord: (recordId: string) => Promise<void>;
  restoreHistoryRecord: (record: TranslationHistoryRecord) => void;
  resetWorkspaceStateForTests: () => void;
};

const initialWorkspaceValues = {
  translationDirection: "en-zh" as const,
  sourceContent: "",
  translationContent: "",
  translationThinkingContent: "",
  sourceViewFormat: "Markdown" as const,
  translationViewFormat: "Markdown" as const,
  historyRecords: [] as TranslationHistoryRecord[],
  translationStatus: "idle" as const,
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  translationDirection: initialWorkspaceValues.translationDirection,
  sourceContent: initialWorkspaceValues.sourceContent,
  translationContent: initialWorkspaceValues.translationContent,
  translationThinkingContent: initialWorkspaceValues.translationThinkingContent,
  sourceViewFormat: initialWorkspaceValues.sourceViewFormat,
  translationViewFormat: initialWorkspaceValues.translationViewFormat,
  historyRecords: initialWorkspaceValues.historyRecords,
  translationStatus: initialWorkspaceValues.translationStatus,
  setTranslationDirection: (translationDirection) => set({ translationDirection }),
  setSourceContent: (sourceContent) => set({ sourceContent, translationStatus: "idle" }),
  setTranslationContent: (translationContent) => set({ translationContent }),
  setTranslationThinkingContent: (translationThinkingContent) => set({ translationThinkingContent }),
  setSourceViewFormat: (sourceViewFormat) => set({ sourceViewFormat }),
  setTranslationViewFormat: (translationViewFormat) => set({ translationViewFormat }),
  setTranslationStatus: (translationStatus) => set({
    translationStatus,
    ...(translationStatus !== "streaming" ? { translationThinkingContent: "" } : null),
  }),
  clearSourceContent: () => set({
    sourceContent: "",
    translationStatus: "idle",
    translationThinkingContent: "",
  }),
  clearTranslationContent: () => set({
    translationContent: "",
    translationThinkingContent: "",
    translationStatus: "idle",
  }),
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
    translationThinkingContent: "",
    sourceViewFormat: record.sourceContentFormat,
    translationViewFormat: record.translationContentFormat,
    translationStatus: "completed",
  }),
  resetWorkspaceStateForTests: () => set({
    ...initialWorkspaceValues,
  }),
}));
