import { useState } from "react";
import {
  ArrowRightLeft,
  Clipboard,
  Download,
  FileText,
  Languages,
  LoaderCircle,
  Play,
  Settings,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

const sampleSource = `# Release notes

Kotoba keeps Markdown structure intact while translating prose.

- Preserve lists and headings
- Keep \`pnpm build\`, URLs, and API names unchanged
- Stream the result into the translation panel`;

const sampleTranslation = `# 发布说明

Kotoba 会在翻译自然语言时保留 Markdown 结构。

- 保留列表和标题
- 保持 \`pnpm build\`、URL 和 API 名称不变
- 将结果流式显示在翻译面板中`;

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

type TranslationDirection = "en-zh" | "zh-en";
type ContentFormat = (typeof inputTypeOptions)[number]["value"];

const translationDirections: Record<TranslationDirection, { sourceKey: string; targetKey: string }> = {
  "en-zh": { sourceKey: "workspace.direction.english", targetKey: "workspace.direction.chinese" },
  "zh-en": { sourceKey: "workspace.direction.chinese", targetKey: "workspace.direction.english" },
};

type WorkspacePageProps = {
  onOpenSettings: () => void;
};

export function WorkspacePage({ onOpenSettings }: WorkspacePageProps) {
  const { t } = useTranslation();
  const [translationDirection, setTranslationDirection] = useState<TranslationDirection>("en-zh");
  const [sourceViewFormat, setSourceViewFormat] = useState<ContentFormat>("Markdown");
  const [translationViewFormat, setTranslationViewFormat] = useState<ContentFormat>("Markdown");
  const direction = translationDirections[translationDirection];
  const sourceLanguage = t(direction.sourceKey);
  const targetLanguage = t(direction.targetKey);
  const selectedStyleLabel = t("workspace.stylePresets.faithful");
  const sourceContentFormat: ContentFormat = "Markdown";
  const translationContentFormat: ContentFormat = "Markdown";
  const sourceContentFormatLabel = t("common.formats.markdown");

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
            onSwitch={() => setTranslationDirection((current) => (current === "en-zh" ? "zh-en" : "en-zh"))}
          />
          <Button type="button" className="ml-0 md:ml-2">
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

        <div className="flex justify-start md:justify-end">
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

      <section className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
        <WorkspacePanel
          title={t("workspace.panels.source.title")}
          description={t("workspace.panels.source.description")}
          meta="README.md · 3.8 KB"
          headerControl={
            <WorkspaceCombobox
              ariaLabel={t("workspace.panels.source.formatLabel")}
              value={sourceViewFormat}
              onValueChange={setSourceViewFormat}
              options={inputTypeOptions}
              className={compactComboboxClassName}
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
            content={sampleSource}
            contentFormat={sourceContentFormat}
            editable
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
            <WorkspaceCombobox
              ariaLabel={t("workspace.panels.translation.formatLabel")}
              value={translationViewFormat}
              onValueChange={setTranslationViewFormat}
              options={inputTypeOptions}
              className={compactComboboxClassName}
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
            content={sampleTranslation}
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

type ContentViewerProps = {
  ariaLabel?: string;
  content: string;
  contentFormat: ContentFormat;
  editable?: boolean;
  viewFormat: ContentFormat;
};

export function ContentViewer({ ariaLabel, content, contentFormat, editable = false, viewFormat }: ContentViewerProps) {
  if (contentFormat === "Plain text" || viewFormat === "Plain text") {
    if (editable) {
      return (
        <>
          <label className="sr-only" htmlFor="source-editor">
            {ariaLabel}
          </label>
          <textarea
            id="source-editor"
            className="min-h-0 flex-1 resize-none rounded-lg border bg-background p-4 font-mono text-sm leading-6 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            defaultValue={content}
          />
        </>
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

  return (
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
  );
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
