import { describe, expect, it } from "vitest";

import { useWorkspaceStore } from "./workspace-store";
import { sampleHistoryRecords } from "./translation-history";

describe("workspace store", () => {
  it("restores a history record into completed workspace state", () => {
    const record = sampleHistoryRecords[0];

    useWorkspaceStore.getState().restoreHistoryRecord(record);

    expect(useWorkspaceStore.getState().sourceContent).toBe(record.sourceContent);
    expect(useWorkspaceStore.getState().translationContent).toBe(record.translatedContent);
    expect(useWorkspaceStore.getState().translationStatus).toBe("completed");
  });
});
