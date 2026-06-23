import { Component, useRef, useState } from "react";
import {
  ArrowRightLeft,
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

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
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
  type ContentFormat,
  type TranslationDirection,
  type TranslationHistoryRecord,
  type TranslationStylePreset,
} from "../translation-history";
import { translateSourceContent } from "../translation-service";
import { useWorkspaceStore } from "../workspace-store";

const styleOptions = [
  { value: "Faithful", labelKey: "workspace.stylePresets.faithful" },
  { value: "Natural", labelKey: "workspace.stylePresets.natural" },
  { value: "Polished", labelKey: "workspace.stylePresets.polished" },
];

const inputTypeOptions = [
  { value: "Markdown", labelKey: "common.formats.markdown" },
  { value: "Plain text", labelKey: "common.formats.plainText" },
] as const;

const compactComboboxClassName = "w-36";

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
  const {
    translationDirection,
    sourceContent,
    translationContent,
    sourceViewFormat,
    translationViewFormat,
    historyRecords,
    translationStatus,
    setTranslationDirection,
    setSourceContent,
    setTranslationContent,
    setSourceViewFormat,
    setTranslationViewFormat,
    setTranslationStatus,
    prependHistoryRecord,
    restoreHistoryRecord,
  } = useWorkspaceStore();
  const direction = translationDirections[translationDirection];
  const sourceLanguage = t(direction.sourceKey);
  const targetLanguage = t(direction.targetKey);
  const selectedStyleLabel = t("workspace.stylePresets.faithful");
  const sourceContentFormat: ContentFormat = "Markdown";
  const translationContentFormat: ContentFormat = "Markdown";
  const sourceContentFormatLabel = t("common.formats.markdown");
  const stylePreset: TranslationStylePreset = "Faithful";
  const providerSettings = {
    baseUrl: "http://101.43.64.125:8000/v1",
    apiKey: "sk-sub-g33qmnkpch841r4emuyy5tug",
    model: "qwen3.7-plus",
  };

  async function handleTranslate() {
    setTranslationStatus("streaming");
    setTranslationContent("");

    let completedTranslation = "";

    try {
      for await (const chunk of translateSourceContent({
        sourceContent,
        sourceContentFormat,
        translationDirection,
        stylePreset,
        settings: providerSettings,
      })) {
        completedTranslation += chunk;
        setTranslationContent(completedTranslation);
      }

      const completedRecord: TranslationHistoryRecord = {
        id: `history-${Date.now()}`,
        title: getHistoryTitle(sourceContent),
        sourceContent,
        translatedContent: completedTranslation,
        sourceContentFormat,
        translationContentFormat,
        translationDirection,
        stylePreset,
        baseUrl: providerSettings.baseUrl,
        model: providerSettings.model,
        createdAt: new Date().toISOString(),
      };

      prependHistoryRecord(completedRecord);
      setTranslationStatus("completed");
    } catch {
      setTranslationStatus("failed");
    }
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="grid shrink-0 grid-cols-1 gap-3 border-b bg-card px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:px-6" role="banner">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
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
            className="ml-0 md:ml-2"
            disabled={translationStatus === "streaming"}
            onClick={handleTranslate}
          >
            <Play data-icon="inline-start" />
            {t("workspace.translate")}
          </Button>
          <WorkspaceCombobox
            ariaLabel={t("workspace.stylePresets.label")}
            value="Faithful"
            options={styleOptions}
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

      <section className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
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
              <Button type="button" variant="outline">
                <Upload data-icon="inline-start" />
                {t("common.actions.upload")}
              </Button>
              <Button type="button" variant="outline">
                <Clipboard data-icon="inline-start" />
                {t("common.actions.copy")}
              </Button>
              <Button type="button" variant="outline">
                <Download data-icon="inline-start" />
                {t("common.actions.download")}
              </Button>
              <Button type="button" variant="ghost">
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
            viewFormat={sourceViewFormat}
          />
        </WorkspacePanel>

        <WorkspacePanel
          title={t("workspace.panels.translation.title")}
          meta={t("workspace.panels.translation.meta", {
            style: selectedStyleLabel,
            model: "deepseek-chat",
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
              <Button type="button" variant="outline" disabled>
                <LoaderCircle data-icon="inline-start" />
                {t("common.actions.stop")}
              </Button>
              <Button type="button" variant="outline" onClick={() => toast.success(t("workspace.panels.translation.copiedToast"))}>
                <Clipboard data-icon="inline-start" />
                {t("common.actions.copy")}
              </Button>
              <Button type="button" variant="outline">
                <Download data-icon="inline-start" />
                {t("workspace.panels.translation.downloadFilename")}
              </Button>
            </>
          }
        >
          <ContentViewer
            content={translationContent}
            contentFormat={translationContentFormat}
            viewFormat={translationViewFormat}
          />
        </WorkspacePanel>

      </section>
    </main>
  );
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
  value: ContentFormat | string;
  onValueChange?: (value: ContentFormat) => void;
  options: readonly { value: ContentFormat | string; labelKey: string }[];
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
};

function TranslationDirectionButton({ source, target, ariaLabel, onSwitch }: TranslationDirectionButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-9 min-w-72 justify-between gap-3 px-3 text-sm"
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
  const { t } = useTranslation();
  const localizedOptions = options.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }));
  const selectedOption = localizedOptions.find((option) => option.value === value);

  return (
    <Combobox
      value={selectedOption?.label ?? value}
      items={localizedOptions.map((option) => option.label)}
      onValueChange={(nextLabel) => {
        const nextOption = localizedOptions.find((option) => option.label === nextLabel);

        if (nextOption) {
          onValueChange?.(nextOption.value as ContentFormat);
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
            {localizedOptions.map((option) => (
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

function ContentDisplayModeControl({ ariaLabel, value, onValueChange }: ContentDisplayModeControlProps) {
  const { t } = useTranslation();

  return (
    <div className="inline-flex max-w-full rounded-lg border bg-muted p-1" role="group" aria-label={ariaLabel}>
      {inputTypeOptions.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "h-7 min-w-20 rounded-md px-3 text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
              isActive
                ? "bg-background text-foreground shadow-sm"
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

function TranslationHistoryDrawer({ records, onRestoreRecord }: TranslationHistoryDrawerProps) {
  const { i18n, t } = useTranslation();
  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: records.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 112,
    overscan: 5,
  });

  return (
    <>
      <DrawerHeader className="border-b">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
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

              return (
                <div
                  key={record.id}
                >
                  <Card size="sm" className="mx-0 mb-3 rounded-lg py-0">
                    <CardHeader className="px-3 py-3">
                      <CardTitle className="truncate text-sm">{record.title}</CardTitle>
                      <CardDescription className="truncate text-xs">
                        {formatHistoryDate(record.createdAt, i18n.language)} · {record.stylePreset} · {record.model}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </>
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
  viewFormat: ContentFormat;
};

export function ContentViewer({ ariaLabel, content, contentFormat, editable = false, onContentChange, viewFormat }: ContentViewerProps) {
  const shouldRenderPlainText = viewFormat === "Plain text";
  void contentFormat;

  if (shouldRenderPlainText) {
    if (editable) {
      return (
        <SourceEditor
          ariaLabel={ariaLabel}
          content={content}
          onContentChange={onContentChange}
        />
      );
    }

    return (
      <article
        aria-label={ariaLabel}
        className="min-h-0 flex-1 overflow-auto rounded-lg border bg-background p-4 font-mono text-sm leading-6"
      >
        <pre className="whitespace-pre-wrap">{content}</pre>
      </article>
    );
  }

  return <MarkdownArticle ariaLabel={ariaLabel} content={content} />;
}

type SourceEditorProps = {
  ariaLabel?: string;
  content: string;
  onContentChange?: (content: string) => void;
};

function SourceEditor({ ariaLabel, content, onContentChange }: SourceEditorProps) {
  return (
    <>
      <label className="sr-only" htmlFor="source-editor">
        {ariaLabel}
      </label>
      <textarea
        id="source-editor"
        className="min-h-0 flex-1 resize-none rounded-lg border bg-background p-4 font-mono text-sm leading-6 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        value={content}
        onChange={(event) => onContentChange?.(event.target.value)}
      />
    </>
  );
}

type MarkdownArticleProps = {
  ariaLabel?: string;
  content: string;
};

function MarkdownArticle({ ariaLabel, content }: MarkdownArticleProps) {
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
        className="min-h-0 flex-1 overflow-auto rounded-lg border bg-background p-4 text-sm leading-6"
      >
        <Streamdown
          mode="static"
          controls={false}
          skipHtml
          className="space-y-4 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_h1]:text-base [&_h1]:font-semibold [&_li]:ml-5 [&_li]:list-disc"
        >
          {content}
        </Streamdown>
      </article>
    </MarkdownRenderBoundary>
  );
}

type RawTextArticleProps = {
  ariaLabel?: string;
  content: string;
};

function RawTextArticle({ ariaLabel, content }: RawTextArticleProps) {
  return (
    <article
      aria-label={ariaLabel}
      className="min-h-0 flex-1 overflow-auto rounded-lg border bg-background p-4 font-mono text-sm leading-6"
    >
      <pre className="whitespace-pre-wrap">{content}</pre>
    </article>
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
    <section className="flex min-h-0 flex-col border-b md:border-b-0 md:border-r" aria-label={title}>
      <div className="flex shrink-0 flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex shrink-0 items-center gap-2">
            <FileText aria-hidden="true" className="text-muted-foreground" />
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
      <div className="flex shrink-0 flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <p className="text-xs text-muted-foreground">{footerStatus}</p>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>
    </section>
  );
}
