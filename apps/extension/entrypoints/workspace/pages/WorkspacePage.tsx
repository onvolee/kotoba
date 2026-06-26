import { Component, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowRightLeft,
  CircleAlert,
  Clipboard,
  Download,
  FileText,
  History,
  Languages,
  LoaderCircle,
  Play,
  Settings,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { useTranslation } from "react-i18next";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Combobox,
  ComboboxContent,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getSavedAISettings,
  type AISettings,
} from "../ai-settings";
import { builtInStylePrompts, getSavedStylePrompts, type StylePrompt } from "../style-prompts";
import {
  estimateHistoryRecordStorageBytes,
  formatStorageBytes,
  type ContentFormat,
  type TranslationDirection,
  type TranslationHistoryRecord,
} from "../translation-history";
import { translateSourceContent } from "../translation-service";
import { useWorkspaceStore } from "../workspace-store";

const inputTypeOptions = [
  { value: "Markdown", labelKey: "common.formats.markdown" },
  { value: "Plain text", labelKey: "common.formats.plainText" },
] as const;

const compactComboboxClassName = "w-36";
const dragFileTypes = ["Files"];

const translationDirections: Record<TranslationDirection, { sourceKey: string; targetKey: string }> = {
  "en-zh": { sourceKey: "workspace.direction.english", targetKey: "workspace.direction.chinese" },
  "zh-en": { sourceKey: "workspace.direction.chinese", targetKey: "workspace.direction.english" },
};

type WorkspacePageProps = {
  onOpenSettings: () => void;
};

export function WorkspacePage({ onOpenSettings }: WorkspacePageProps) {
  const { t } = useTranslation();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isFileDragActive, setIsFileDragActive] = useState(false);
  const [stylePrompts, setStylePrompts] = useState<StylePrompt[]>(builtInStylePrompts);
  const [selectedStylePromptId, setSelectedStylePromptId] = useState(builtInStylePrompts[0]?.id ?? "");
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const fileDragDepthRef = useRef(0);
  const activeTranslationAbortControllerRef = useRef<AbortController | null>(null);
  const {
    translationDirection,
    sourceContent,
    translationContent,
    translationThinkingContent,
    translationErrorMessage,
    sourceViewFormat,
    translationViewFormat,
    historyRecords,
    translationStatus,
    setTranslationDirection,
    setSourceContent,
    setTranslationContent,
    setTranslationThinkingContent,
    setTranslationErrorMessage,
    setSourceViewFormat,
    setTranslationViewFormat,
    setTranslationStatus,
    clearSourceContent,
    clearTranslationContent,
    prependHistoryRecord,
    deleteHistoryRecord,
    restoreHistoryRecord,
  } = useWorkspaceStore();
  const direction = translationDirections[translationDirection];
  const sourceLanguage = t(direction.sourceKey);
  const targetLanguage = t(direction.targetKey);
  const sourceContentFormat: ContentFormat = "Markdown";
  const translationContentFormat: ContentFormat = "Markdown";
  const sourceContentFormatLabel = t("common.formats.markdown");
  const selectedStylePrompt = stylePrompts.find((stylePrompt) => stylePrompt.id === selectedStylePromptId) ?? stylePrompts[0];
  const selectedStylePromptName = selectedStylePrompt ? getStylePromptDisplayName(selectedStylePrompt, t) : "";
  const isTranslating = translationStatus === "streaming";
  const hasSourceContent = sourceContent.trim().length > 0;
  const hasTranslationContent = translationContent.trim().length > 0;
  const canTranslate = hasSourceContent && !isTranslating && Boolean(selectedStylePrompt);
  const canUseSourceActions = !isTranslating;
  const canUseTranslationActions = hasTranslationContent && !isTranslating;
  const shouldShowThinkingStatus = isTranslating && translationThinkingContent.trim().length > 0 && !hasTranslationContent;

  useEffect(() => {
    let isMounted = true;

    getSavedStylePrompts().then((savedPrompts) => {
      if (!isMounted) {
        return;
      }

      setStylePrompts(savedPrompts);
      setSelectedStylePromptId((currentId) => (
        savedPrompts.some((stylePrompt) => stylePrompt.id === currentId)
          ? currentId
          : savedPrompts[0]?.id ?? ""
      ));
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleTranslate() {
    if (!hasSourceContent || isTranslating || !selectedStylePrompt) {
      return;
    }

    const providerSettings = await getSavedAISettings();

    if (!hasCompleteAISettings(providerSettings)) {
      setTranslationContent("");
      setTranslationErrorMessage(t("workspace.missingProviderSettings"));
      setTranslationStatus("failed");
      toast.error(t("workspace.missingProviderSettings"));
      return;
    }

    const abortController = new AbortController();
    activeTranslationAbortControllerRef.current = abortController;

    setTranslationStatus("streaming");
    setTranslationContent("");
    setTranslationThinkingContent("");
    setTranslationErrorMessage("");

    let completedTranslation = "";
    let completedThinking = "";

    try {
      for await (const event of translateSourceContent({
        sourceContent,
        sourceContentFormat,
        translationDirection,
        stylePrompt: selectedStylePrompt.prompt,
        settings: providerSettings,
        abortSignal: abortController.signal,
      })) {
        if (event.type === "thinking") {
          completedThinking += event.text;
          setTranslationThinkingContent(completedThinking);
        }

        if (event.type === "text") {
          completedTranslation += event.text;
          setTranslationContent(completedTranslation);
        }
      }

      if (abortController.signal.aborted) {
        setTranslationStatus(completedTranslation.trim().length > 0 ? "stopped" : "idle");
        return;
      }

      const completedRecord: TranslationHistoryRecord = {
        id: `history-${Date.now()}`,
        title: getHistoryTitle(sourceContent),
        sourceContent,
        translatedContent: completedTranslation,
        sourceContentFormat,
        translationContentFormat,
        translationDirection,
        stylePromptName: selectedStylePromptName,
        baseUrl: providerSettings.baseUrl,
        model: providerSettings.model,
        createdAt: new Date().toISOString(),
      };

      await prependHistoryRecord(completedRecord);
      setTranslationStatus("completed");
    } catch (error) {
      if (abortController.signal.aborted || isAbortError(error)) {
        setTranslationStatus(completedTranslation.trim().length > 0 ? "stopped" : "idle");
        return;
      }

      setTranslationStatus("failed");
      const failureMessage = getTranslationFailureMessage(error);
      setTranslationErrorMessage(failureMessage);
      toast.error(t("workspace.panels.translation.requestFailedToast"), {
        description: failureMessage,
      });
    } finally {
      if (activeTranslationAbortControllerRef.current === abortController) {
        activeTranslationAbortControllerRef.current = null;
      }
    }
  }

  function handleStopTranslation() {
    activeTranslationAbortControllerRef.current?.abort();
  }

  function resetFileDragState() {
    fileDragDepthRef.current = 0;
    setIsFileDragActive(false);
  }

  function shouldHandleFileDrag(dataTransfer: DataTransfer): boolean {
    return Array.from(dataTransfer.types).some((type) => dragFileTypes.includes(type));
  }

  async function handleUploadSourceFile(file: File | undefined) {
    if (!file || isTranslating) {
      return;
    }

    setSourceContent(await file.text());
    toast.success(t("workspace.panels.source.uploadedToast"));

    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  }

  async function handleCopy(content: string, successMessage: string) {
    if (!content.trim()) {
      return;
    }

    await navigator.clipboard.writeText(content);
    toast.success(successMessage);
  }

  function handleDownload(content: string, filename: string) {
    if (!content.trim()) {
      return;
    }

    const objectUrl = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <main
      className="relative flex h-screen flex-col overflow-hidden bg-background text-foreground"
      onDragEnter={(event) => {
        if (isTranslating || !shouldHandleFileDrag(event.dataTransfer)) {
          return;
        }

        event.preventDefault();
        fileDragDepthRef.current += 1;
        setIsFileDragActive(true);
      }}
      onDragOver={(event) => {
        if (isTranslating || !shouldHandleFileDrag(event.dataTransfer)) {
          return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(event) => {
        if (isTranslating || !isFileDragActive) {
          return;
        }

        fileDragDepthRef.current = Math.max(0, fileDragDepthRef.current - 1);

        if (fileDragDepthRef.current === 0) {
          setIsFileDragActive(false);
        }
      }}
      onDrop={(event) => {
        if (isTranslating || !shouldHandleFileDrag(event.dataTransfer)) {
          return;
        }

        event.preventDefault();
        resetFileDragState();
        void handleUploadSourceFile(event.dataTransfer.files[0]);
      }}
    >
      <a
        href="#workspace-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:ring-3 focus:ring-ring/50"
      >
        Skip to workspace
      </a>
      <header className="grid shrink-0 grid-cols-1 gap-3 border-b bg-card px-4 py-3 shadow-[0_1px_2px_rgb(17_24_39/0.03)] md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:px-6" role="banner">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--ring),transparent_52%)] bg-accent text-accent-foreground shadow-[0_8px_24px_rgb(0_212_164/0.10)]">
            <Languages aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-semibold leading-6">Kotoba</h1>
            <p className="truncate text-sm text-muted-foreground">{t("workspace.subtitle")}</p>
          </div>
        </div>

        <form className="flex flex-wrap items-center justify-start gap-2 md:justify-center" aria-label={t("workspace.controls.label")}>
          <TranslationDirectionButton
            source={sourceLanguage}
            target={targetLanguage}
            ariaLabel={t("workspace.direction.ariaLabel", {
              source: sourceLanguage,
            target: targetLanguage,
            })}
            onSwitch={() => setTranslationDirection(translationDirection === "en-zh" ? "zh-en" : "en-zh")}
          />
          <Button
            type="button"
            className="ml-0 rounded-full px-4 md:ml-2"
            disabled={!canTranslate}
            onClick={handleTranslate}
          >
            <Play data-icon="inline-start" />
            {t("workspace.translate")}
          </Button>
          <WorkspaceCombobox
            ariaLabel={t("workspace.stylePrompts.label")}
            value={selectedStylePrompt?.id ?? ""}
            options={stylePrompts.map((stylePrompt) => ({
              value: stylePrompt.id,
              label: getStylePromptDisplayName(stylePrompt, t),
            }))}
            onValueChange={setSelectedStylePromptId}
            className={compactComboboxClassName}
          />
        </form>

        <div className="flex justify-start gap-1 md:justify-end">
          <Drawer direction="right" open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <DrawerTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("workspace.openHistory")}
              >
                <History aria-hidden="true" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="w-[min(24rem,calc(100vw-1.5rem))] sm:max-w-none">
              <TranslationHistoryDrawer
                records={historyRecords}
                onRestoreRecord={(record) => {
                  restoreHistoryRecord(record);
                  setIsHistoryOpen(false);
                }}
                onDeleteRecord={deleteHistoryRecord}
              />
            </DrawerContent>
          </Drawer>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("workspace.openSettings")}
            onClick={onOpenSettings}
          >
            <Settings aria-hidden="true" />
          </Button>
        </div>
      </header>

      <section id="workspace-content" className="grid min-h-0 flex-1 scroll-mt-4 grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <WorkspacePanel
          title={t("workspace.panels.source.title")}
          description={t("workspace.panels.source.description")}
          meta="README.md · 3.8 KB"
          headerControl={
            <ContentDisplayModeControl
              ariaLabel={t("workspace.panels.source.formatLabel")}
              value={sourceViewFormat}
              onValueChange={setSourceViewFormat}
            />
          }
          footerStatus={t("workspace.panels.source.footerStatus", { format: sourceContentFormatLabel })}
          actions={
            <>
              <input
                ref={uploadInputRef}
                type="file"
                accept=".md,.markdown,.txt,text/markdown,text/plain"
                className="sr-only"
                onChange={(event) => void handleUploadSourceFile(event.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                disabled={!canUseSourceActions}
                onClick={() => uploadInputRef.current?.click()}
              >
                <Upload data-icon="inline-start" />
                {t("common.actions.upload")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!hasSourceContent || !canUseSourceActions}
                onClick={() => void handleCopy(sourceContent, t("workspace.panels.source.copiedToast"))}
              >
                <Clipboard data-icon="inline-start" />
                {t("common.actions.copy")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!hasSourceContent || !canUseSourceActions}
                onClick={() => handleDownload(sourceContent, "kotoba-source.md")}
              >
                <Download data-icon="inline-start" />
                {t("common.actions.download")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={!hasSourceContent || !canUseSourceActions}
                onClick={clearSourceContent}
              >
                <Trash2 data-icon="inline-start" />
                {t("common.actions.clear")}
              </Button>
            </>
          }
        >
          <ContentViewer
            ariaLabel={t("workspace.panels.source.contentLabel")}
            content={sourceContent}
            contentFormat={sourceContentFormat}
            editable
            onContentChange={setSourceContent}
            placeholder={t("workspace.panels.source.placeholder")}
            viewFormat={sourceViewFormat}
          />
        </WorkspacePanel>

        <WorkspacePanel
          title={t("workspace.panels.translation.title")}
          meta={t("workspace.panels.translation.meta", {
            style: selectedStylePromptName || t("workspace.stylePrompts.none"),
            model: t("workspace.panels.translation.noModel"),
          })}
          headerControl={
            <ContentDisplayModeControl
              ariaLabel={t("workspace.panels.translation.formatLabel")}
              value={translationViewFormat}
              onValueChange={setTranslationViewFormat}
            />
          }
          footerStatus={t("workspace.panels.translation.footerStatus")}
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                disabled={!isTranslating}
                onClick={handleStopTranslation}
              >
                <LoaderCircle data-icon="inline-start" />
                {t("common.actions.stop")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!canUseTranslationActions}
                onClick={() => void handleCopy(translationContent, t("workspace.panels.translation.copiedToast"))}
              >
                <Clipboard data-icon="inline-start" />
                {t("common.actions.copy")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!canUseTranslationActions}
                onClick={() => handleDownload(translationContent, "kotoba-translation.md")}
              >
                <Download data-icon="inline-start" />
                {t("workspace.panels.translation.downloadFilename")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={!canUseTranslationActions}
                onClick={clearTranslationContent}
              >
                <Trash2 data-icon="inline-start" />
                {t("common.actions.clear")}
              </Button>
            </>
          }
        >
          <div className="relative flex min-h-0 flex-1">
            <ContentViewer
              content={translationContent}
              contentFormat={translationContentFormat}
              placeholder={t("workspace.panels.translation.placeholder")}
              viewFormat={translationViewFormat}
            />
            {translationStatus === "failed" && translationErrorMessage ? (
              <TranslationErrorPanel
                description={t("workspace.panels.translation.errorDescription")}
                message={translationErrorMessage}
                title={t("workspace.panels.translation.requestFailedToast")}
              />
            ) : null}
            {shouldShowThinkingStatus ? (
              <ThinkingStatusPanel content={translationThinkingContent} />
            ) : null}
          </div>
        </WorkspacePanel>

      </section>
      {isFileDragActive ? <WorkspaceFileDropOverlay /> : null}
    </main>
  );
}

function hasCompleteAISettings(settings: AISettings): boolean {
  return Boolean(settings.baseUrl && settings.apiKey && settings.model);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function getTranslationFailureMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return "Unknown provider error";
}

type WorkspacePanelProps = {
  title: string;
  description?: string;
  meta: string;
  headerControl?: React.ReactNode;
  footerStatus: string;
  actions: React.ReactNode;
  children: React.ReactNode;
};

type WorkspaceComboboxProps = {
  ariaLabel: string;
  value: string;
  onValueChange?: (value: string) => void;
  options: readonly { value: string; label: string }[];
  className?: string;
};

type TranslationDirectionButtonProps = {
  source: string;
  target: string;
  ariaLabel: string;
  onSwitch: () => void;
};

type ContentDisplayModeControlProps = {
  ariaLabel: string;
  value: ContentFormat;
  onValueChange: (value: ContentFormat) => void;
};

type TranslationHistoryDrawerProps = {
  records: TranslationHistoryRecord[];
  onRestoreRecord: (record: TranslationHistoryRecord) => void;
  onDeleteRecord: (recordId: string) => void;
};

function TranslationDirectionButton({ source, target, ariaLabel, onSwitch }: TranslationDirectionButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-9 min-w-72 justify-between gap-3 rounded-full px-3 text-sm"
      aria-label={ariaLabel}
      onClick={onSwitch}
    >
      <span className="min-w-0 flex-1 truncate text-left">{source}</span>
      <ArrowRightLeft aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-right">{target}</span>
    </Button>
  );
}

export function WorkspaceCombobox({ ariaLabel, value, onValueChange, options, className }: WorkspaceComboboxProps) {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <Combobox
      value={selectedOption?.label ?? value}
      items={options.map((option) => option.label)}
      onValueChange={(nextLabel) => {
        const nextOption = options.find((option) => option.label === nextLabel);

        if (nextOption) {
          onValueChange?.(nextOption.value);
        }
      }}
    >
      <ComboboxInput
        aria-label={ariaLabel}
        readOnly
        showClear={false}
        className={className}
      />
      <ComboboxContent>
        <ComboboxList>
          <ComboboxGroup>
            {options.map((option) => (
              <ComboboxItem key={option.value} value={option.label}>
                {option.label}
              </ComboboxItem>
            ))}
          </ComboboxGroup>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function getStylePromptDisplayName(stylePrompt: StylePrompt, t: ReturnType<typeof useTranslation>["t"]): string {
  return stylePrompt.source === "built-in"
    ? t(`settings.stylePrompts.builtIns.${stylePrompt.id}.name`)
    : stylePrompt.name;
}

function ContentDisplayModeControl({ ariaLabel, value, onValueChange }: ContentDisplayModeControlProps) {
  const { t } = useTranslation();

  return (
    <div className="inline-flex max-w-full rounded-full border bg-muted p-1" role="group" aria-label={ariaLabel}>
      {inputTypeOptions.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "h-7 min-w-20 rounded-full px-3 text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
              isActive
                ? "bg-card text-foreground shadow-sm ring-1 ring-border/70"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t(option.labelKey)}
          </button>
        );
      })}
    </div>
  );
}

function TranslationHistoryDrawer({ records, onDeleteRecord, onRestoreRecord }: TranslationHistoryDrawerProps) {
  const { i18n, t } = useTranslation();
  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: records.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 128,
    overscan: 5,
  });

  return (
    <>
      <DrawerHeader className="border-b bg-muted/35">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground ring-1 ring-ring/20">
            <History aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <DrawerTitle className="sr-only">{t("workspace.history.ariaLabel")}</DrawerTitle>
            <h2 className="text-sm font-semibold">{t("workspace.history.title")}</h2>
            <DrawerDescription>
              {t("workspace.history.recordCount", { count: records.length })}
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("workspace.history.close")}
            >
              <X aria-hidden="true" />
            </Button>
          </DrawerClose>
        </div>
      </DrawerHeader>

      <ScrollArea viewportRef={parentRef} className="min-h-0 flex-1 overscroll-contain">
        <div className="px-3 py-3">
          {records.length === 0 ? (
            <TranslationHistoryEmptyState />
          ) : (
            <div
              className="relative w-full"
              // style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
              {(rowVirtualizer.getVirtualItems().length > 0
                ? rowVirtualizer.getVirtualItems()
                : records.slice(0, 8).map((_, index) => ({
                    key: records[index].id,
                    index,
                    size: 112,
                    start: index * 112,
                  }))
              ).map((virtualItem) => {
                const record = records[virtualItem.index];
                const storageSize = formatStorageBytes(estimateHistoryRecordStorageBytes(record));

                return (
                  <div
                    key={record.id}
                  >
                    <Card size="sm" className="group/history mx-0 mb-3 rounded-lg border border-border/70 bg-card py-0 shadow-none transition-colors hover:border-ring/35 hover:bg-accent/25">
                      <div className="flex min-w-0 items-start gap-2 p-3.5">
                        <button
                          type="button"
                          className="min-w-0 flex-1 rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                          aria-label={t("workspace.history.restoreRecord", { title: record.title })}
                          onClick={() => onRestoreRecord(record)}
                        >
                          <CardTitle className="truncate text-[0.95rem] leading-5">{record.title}</CardTitle>
                          <CardDescription className="mt-1 truncate text-xs leading-5">
                            {formatHistoryDate(record.createdAt, i18n.language)} · {record.stylePromptName}
                          </CardDescription>
                          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
                            <span className="max-w-full truncate rounded-md border border-border/60 bg-muted/70 px-1.5 py-0.5 font-mono text-xs text-muted-foreground" translate="no">
                              {record.model}
                            </span>
                            <span className="rounded-md border border-border/60 bg-background/70 px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
                              {storageSize}
                            </span>
                          </div>
                        </button>
                        <DeleteHistoryRecordPopover
                          record={record}
                          onDeleteRecord={onDeleteRecord}
                        />
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
}

function DeleteHistoryRecordPopover({
  record,
  onDeleteRecord,
}: {
  record: TranslationHistoryRecord;
  onDeleteRecord: (recordId: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const popoverContainerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div ref={popoverContainerRef}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="mt-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/20 aria-expanded:bg-destructive/10 aria-expanded:text-destructive"
              aria-label={t("workspace.history.deleteRecord", { title: record.title })}
            />
          }
        >
          <Trash2 aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="left"
          sideOffset={8}
          portalContainer={popoverContainerRef}
          className="w-72 gap-3 p-3"
        >
          <PopoverHeader>
            <PopoverTitle>{t("workspace.history.deleteConfirmTitle")}</PopoverTitle>
            <PopoverDescription className="wrap-break-word text-xs leading-5">
              {t("workspace.history.deleteConfirmDescription", { title: record.title })}
            </PopoverDescription>
          </PopoverHeader>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              {t("workspace.history.cancelDelete")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                onDeleteRecord(record.id);
                setOpen(false);
              }}
            >
              <Trash2 data-icon="inline-start" />
              {t("workspace.history.confirmDelete")}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function TranslationHistoryEmptyState() {
  const { t } = useTranslation();

  return (
    <Empty className="min-h-96 rounded-lg border bg-muted/35 px-5">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="relative size-10 bg-card text-muted-foreground ring-1 ring-border">
          <FileText aria-hidden="true" />
          <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-md bg-accent text-accent-foreground ring-2 ring-background">
            <Languages aria-hidden="true" />
          </span>
        </EmptyMedia>
        <EmptyTitle className="text-base text-pretty">{t("workspace.history.emptyTitle")}</EmptyTitle>
        <EmptyDescription>{t("workspace.history.emptyDescription")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="rounded-md border bg-background/70 px-2.5 py-1.5 text-xs text-muted-foreground">
          {t("workspace.history.emptyHint")}
        </div>
      </EmptyContent>
    </Empty>
  );
}

function formatHistoryDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getHistoryTitle(sourceContent: string): string {
  const heading = sourceContent.match(/^#\s+(.+)$/m)?.[1]?.trim();

  return heading || sourceContent.trim().split(/\s+/).slice(0, 6).join(" ") || "Untitled translation";
}

type ContentViewerProps = {
  ariaLabel?: string;
  content: string;
  contentFormat: ContentFormat;
  editable?: boolean;
  onContentChange?: (content: string) => void;
  placeholder?: string;
  viewFormat: ContentFormat;
};

function ThinkingStatusPanel({ content }: { content: string }) {
  const { t } = useTranslation();

  return (
    <aside
      aria-live="polite"
      className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-card/70 p-6 backdrop-blur-[1px]"
    >
      <div className="w-[min(34rem,100%)] rounded-lg border border-border/80 bg-muted/75 p-4 text-sm text-muted-foreground shadow-[0_16px_48px_rgb(15_23_42/0.08),inset_0_1px_0_rgb(255_255_255/0.70)]">
        <div className="mb-3 flex items-center gap-2 font-medium text-foreground/80">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-muted-foreground" />
          <span>{t("workspace.panels.translation.thinkingTitle")}</span>
        </div>
        <div className="h-40 overflow-hidden rounded-md border border-border/60 bg-background/65 p-1">
          <WorkspaceScrollArea>
            <div className="px-2 py-1 font-mono text-xs leading-5 text-muted-foreground">
              <pre className="whitespace-pre-wrap">{content}</pre>
            </div>
          </WorkspaceScrollArea>
        </div>
      </div>
    </aside>
  );
}

function WorkspaceFileDropOverlay() {
  const { t } = useTranslation();

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-foreground/55 p-6 backdrop-blur-[5px]"
    >
      <div className="animate-file-drop-sheet relative grid min-h-[17rem] w-[min(26.25rem,calc(100vw-3.25rem))] place-items-center overflow-hidden rounded-lg border border-card/75 bg-card px-7 py-8 text-center text-card-foreground shadow-[0_24px_70px_rgb(17_24_39/0.20)]">
        <div className="animate-file-drop-haze absolute inset-0 bg-card/20" />
        <div className="animate-file-drop-border absolute inset-4 rounded-md border border-dashed border-ring/45" />
        <div className="animate-file-drop-content relative z-10 grid justify-items-center gap-3">
          <div className="grid size-14 place-items-center rounded-full bg-accent text-accent-foreground">
            <Upload aria-hidden="true" className="size-7" />
          </div>
          <strong className="text-xl leading-tight">{t("workspace.fileDrop.title")}</strong>
          <p className="max-w-80 text-sm leading-6 text-muted-foreground">
            {t("workspace.fileDrop.description")}
          </p>
          <span className="inline-flex min-h-8 items-center rounded-full border border-border/80 bg-background/80 px-3 font-mono text-xs text-accent-foreground">
            {t("workspace.fileDrop.meta")}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ContentViewer({ ariaLabel, content, contentFormat, editable = false, onContentChange, placeholder, viewFormat }: ContentViewerProps) {
  const shouldRenderPlainText = viewFormat === "Plain text";
  void contentFormat;

  if (shouldRenderPlainText) {
    if (editable) {
      return (
        <SourceEditor
          ariaLabel={ariaLabel}
          content={content}
          onContentChange={onContentChange}
          placeholder={placeholder}
        />
      );
    }

    return (
      <article
        aria-label={ariaLabel}
        className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-card p-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.60)]"
      >
        <WorkspaceScrollArea>
          <div className="p-3 pr-5 font-mono text-sm leading-6">
            {content.trim().length > 0 ? (
              <pre className="whitespace-pre-wrap">{content}</pre>
            ) : (
              <EmptyContentPlaceholder>{placeholder}</EmptyContentPlaceholder>
            )}
          </div>
        </WorkspaceScrollArea>
      </article>
    );
  }

  return <MarkdownArticle ariaLabel={ariaLabel} content={content} placeholder={placeholder} />;
}

type SourceEditorProps = {
  ariaLabel?: string;
  content: string;
  onContentChange?: (content: string) => void;
  placeholder?: string;
};

function SourceEditor({ ariaLabel, content, onContentChange, placeholder }: SourceEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [content]);

  return (
    <>
      <label className="sr-only" htmlFor="source-editor">
        {ariaLabel}
      </label>
      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-card p-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.60)] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
        <WorkspaceScrollArea contentClassName="min-h-full">
          <textarea
            ref={textareaRef}
            id="source-editor"
            className="block min-h-full w-full resize-none overflow-hidden bg-transparent p-3 pr-5 font-mono text-sm leading-6 outline-none"
            value={content}
            placeholder={placeholder}
            onChange={(event) => onContentChange?.(event.target.value)}
          />
        </WorkspaceScrollArea>
      </div>
    </>
  );
}

type MarkdownArticleProps = {
  ariaLabel?: string;
  content: string;
  placeholder?: string;
};

function MarkdownArticle({ ariaLabel, content, placeholder }: MarkdownArticleProps) {
  if (content.trim().length === 0) {
    return (
      <RawTextArticle
        ariaLabel={ariaLabel}
        content=""
        placeholder={placeholder}
      />
    );
  }

  return (
    <MarkdownRenderBoundary
      key={content}
      fallback={
        <RawTextArticle
          ariaLabel={ariaLabel}
          content={content}
        />
      }
    >
      <article
        aria-label={ariaLabel}
        className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-card p-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.60)]"
      >
        <WorkspaceScrollArea>
          <div className="p-3 pr-5 text-sm leading-6">
            <Streamdown
              mode="static"
              controls={false}
              skipHtml
              className="space-y-4 [&_code]:rounded [&_code]:bg-accent [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-accent-foreground [&_h1]:text-base [&_h1]:font-semibold [&_li]:ml-5 [&_li]:list-disc"
            >
              {content}
            </Streamdown>
          </div>
        </WorkspaceScrollArea>
      </article>
    </MarkdownRenderBoundary>
  );
}

type RawTextArticleProps = {
  ariaLabel?: string;
  content: string;
  placeholder?: string;
};

function RawTextArticle({ ariaLabel, content, placeholder }: RawTextArticleProps) {
  return (
    <article
      aria-label={ariaLabel}
      className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-card p-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.60)]"
    >
      <WorkspaceScrollArea>
        <div className="p-3 pr-5 font-mono text-sm leading-6">
          {content.trim().length > 0 ? (
            <pre className="whitespace-pre-wrap">{content}</pre>
          ) : (
            <EmptyContentPlaceholder>{placeholder}</EmptyContentPlaceholder>
          )}
        </div>
      </WorkspaceScrollArea>
    </article>
  );
}

function WorkspaceScrollArea({
  children,
  contentClassName,
}: {
  children: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <BaseScrollArea.Root className="relative size-full rounded-md">
      <BaseScrollArea.Viewport className="size-full rounded-[inherit] outline-none">
        <BaseScrollArea.Content className={cn("min-w-fit", contentClassName)}>
          {children}
        </BaseScrollArea.Content>
      </BaseScrollArea.Viewport>
      <BaseScrollArea.Scrollbar
        keepMounted
        className="flex w-4 touch-none justify-center p-1 opacity-0 transition-opacity select-none data-[has-overflow-y]:opacity-100"
      >
        <BaseScrollArea.Thumb className="w-2 rounded-full bg-muted-foreground/45" />
      </BaseScrollArea.Scrollbar>
      <BaseScrollArea.Corner />
    </BaseScrollArea.Root>
  );
}

function EmptyContentPlaceholder({ children }: { children?: string }) {
  return (
    <p className="max-w-md text-sm leading-6 text-muted-foreground/75">
      {children}
    </p>
  );
}

type TranslationErrorPanelProps = {
  title: string;
  message: string;
  description: string;
};

function TranslationErrorPanel({ title, message, description }: TranslationErrorPanelProps) {
  return (
    <div className="absolute inset-0 flex items-start bg-card/95 p-4">
      <div className="grid max-w-xl gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm shadow-sm">
        <div className="flex items-center gap-2 font-semibold text-destructive">
          <CircleAlert aria-hidden="true" className="size-4" />
          <span>{title}</span>
        </div>
        <p className="break-words font-mono text-xs leading-5 text-foreground">{message}</p>
        <p className="leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

type MarkdownRenderBoundaryProps = {
  children: React.ReactNode;
  fallback: React.ReactNode;
};

type MarkdownRenderBoundaryState = {
  failed: boolean;
};

class MarkdownRenderBoundary extends Component<MarkdownRenderBoundaryProps, MarkdownRenderBoundaryState> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function WorkspacePanel({ title, description, meta, headerControl, footerStatus, actions, children }: WorkspacePanelProps) {
  return (
    <section
      className="flex min-h-0 flex-col border-b bg-muted/20 md:border-b-0 md:border-r"
      aria-label={title}
    >
      <div className="flex shrink-0 flex-col gap-2 border-b bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex shrink-0 items-center gap-2">
            <FileText aria-hidden="true" className="text-accent-foreground" />
            <h2 className="text-sm font-semibold">{title}</h2>
          </div>
          {description ? (
            <p className="min-w-0 truncate text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <p className="truncate text-xs text-muted-foreground sm:text-right">{meta}</p>
          {headerControl}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 md:p-6">{children}</div>
      <div className="flex shrink-0 flex-col gap-3 border-t bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <p className="text-xs text-muted-foreground">{footerStatus}</p>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>
    </section>
  );
}
