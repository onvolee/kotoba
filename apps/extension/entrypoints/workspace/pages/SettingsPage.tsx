import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Database,
  Pencil,
  Eye,
  EyeOff,
  KeyRound,
  Languages,
  MonitorCog,
  Palette,
  PlugZap,
  Plus,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch, SwitchThumb } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { testAIConnection } from "../ai-connection";
import { getSavedAISettings, saveAIConnectionStatus, saveAISettings, type AIConnectionStatus, type AISettings } from "../ai-settings";
import { applyUiLanguagePreference, getSavedUiLanguagePreference, type UiLanguagePreference } from "../i18n";
import { addStylePrompt, deleteStylePrompt, getSavedStylePrompts, updateStylePrompt, type StylePrompt } from "../style-prompts";
import { applyThemePreference, getSavedThemePreference, type WorkspaceThemePreference } from "../theme-preference";
import { estimateHistoryStorageUsage, formatStorageBytes } from "../translation-history";
import { useWorkspaceStore } from "../workspace-store";

type SettingsModule = "ai" | "local-data" | "performance" | "style-prompts";
type StylePromptEditorState =
  | { mode: "create" }
  | { mode: "edit"; stylePrompt: StylePrompt }
  | { mode: "view"; stylePrompt: StylePrompt };

const settingsModules: {
  id: SettingsModule;
  labelKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "performance",
    labelKey: "settings.performance.title",
    descriptionKey: "settings.modules.performanceDescription",
    icon: <MonitorCog aria-hidden="true" />,
  },
  {
    id: "ai",
    labelKey: "settings.ai.title",
    descriptionKey: "settings.modules.aiDescription",
    icon: <PlugZap aria-hidden="true" />,
  },
  {
    id: "style-prompts",
    labelKey: "settings.stylePrompts.title",
    descriptionKey: "settings.modules.stylePromptsDescription",
    icon: <Palette aria-hidden="true" />,
  },
  {
    id: "local-data",
    labelKey: "settings.localData.title",
    descriptionKey: "settings.modules.localDataDescription",
    icon: <Database aria-hidden="true" />,
  },
];

export function SettingsPage() {
  const { t } = useTranslation();
  const [activeModule, setActiveModule] = useState<SettingsModule>("performance");

  return (
    <main className="flex h-screen min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <a
        href="#settings-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:ring-3 focus:ring-ring/50"
      >
        Skip to settings
      </a>
      <header className="grid shrink-0 grid-cols-1 gap-3 border-b bg-card px-4 py-3 shadow-[0_1px_2px_rgb(17_24_39/0.03)] md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:px-6" role="banner">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--ring),transparent_52%)] bg-accent text-accent-foreground shadow-[0_8px_24px_rgb(0_212_164/0.10)]">
            <Languages aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold leading-6">Kotoba</p>
            <p className="truncate text-sm text-muted-foreground">{t("workspace.subtitle")}</p>
          </div>
        </div>

        <div className="min-w-0 text-left md:text-center">
          <h1 className="truncate text-base font-semibold leading-6">{t("settings.title")}</h1>
          <p className="truncate text-sm text-muted-foreground">{t("settings.localConfiguration")}</p>
        </div>

        <div className="flex justify-start md:justify-end">
          <a
            href="#"
            aria-label={t("settings.backToWorkspace")}
            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border bg-background px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none hover:border-ring/40 hover:bg-accent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ArrowLeft data-icon="inline-start" />
            {t("settings.workspace")}
          </a>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 justify-center bg-muted/20 px-4 py-4 md:px-6">
        <div className="grid min-h-0 w-full max-w-[1200px] grid-cols-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-lg border bg-card shadow-[0_4px_12px_rgb(17_24_39/0.04)] md:grid-cols-[18rem_minmax(0,1fr)] md:grid-rows-1">
          <aside className="border-b bg-muted/35 md:border-b-0 md:border-r" aria-label={t("settings.menu")}>
            <div className="flex flex-col gap-3 p-2 md:p-4">
              <nav className="flex flex-col gap-2" aria-label={t("settings.modules.navigation")}>
                {settingsModules.map((module) => (
                  <button
                    key={module.id}
                    type="button"
                    aria-current={activeModule === module.id ? "page" : undefined}
                    onClick={() => setActiveModule(module.id)}
                    className={cn(
                      "grid min-h-14 grid-cols-[2rem_minmax(0,1fr)] items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                      activeModule === module.id
                        ? "border-ring/35 bg-accent text-accent-foreground shadow-sm"
                        : "border-transparent hover:border-border hover:bg-card"
                    )}
                  >
                    <span className={cn(
                      "flex size-8 items-center justify-center rounded-lg bg-card text-foreground ring-1 ring-border/60",
                      activeModule === module.id ? "text-accent-foreground ring-ring/25" : null
                    )}>
                      {module.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{t(module.labelKey)}</span>
                      <span className={cn("block truncate text-xs", activeModule === module.id ? "text-accent-foreground/80" : "text-muted-foreground")}>
                        {t(module.descriptionKey)}
                      </span>
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <section id="settings-content" className="flex h-full min-h-0 min-w-0 flex-col scroll-mt-4 p-4 md:p-6" aria-label={t("settings.activeModule")}>
            {activeModule === "ai" ? <AISettingsModule /> : null}
            {activeModule === "style-prompts" ? <StylePromptsModule /> : null}
            {activeModule === "local-data" ? <LocalDataModule /> : null}
            {activeModule === "performance" ? <PerformanceModule /> : null}
          </section>
        </div>
      </div>
    </main>
  );
}

function AISettingsModule() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AISettings>({
    baseUrl: "",
    apiKey: "",
    model: "",
    thinkingEnabled: false,
  });
  const [connectionStatus, setConnectionStatus] = useState<AIConnectionStatus | "testing">("not-tested");
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getSavedAISettings().then((savedSettings) => {
      if (isMounted) {
        setSettings(savedSettings);
        setConnectionStatus(savedSettings.connectionStatus);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSaveSettings() {
    const savedSettings = await saveAISettings(settings);
    setSettings(savedSettings);
    setConnectionStatus(savedSettings.connectionStatus);
    toast.success(t("settings.savedToast"));
  }

  async function handleTestConnection() {
    const savedSettings = await saveAISettings(settings);
    setSettings(savedSettings);
    setConnectionStatus("testing");

    const result = await testAIConnection(toAISettings(savedSettings));
    const nextStatus = result.ok ? "passed" : "failed";
    const settingsWithStatus = await saveAIConnectionStatus(nextStatus);

    setConnectionStatus(settingsWithStatus.connectionStatus);
  }

  return (
    <ModuleShell
      title={t("settings.ai.title")}
      description={t("settings.ai.description")}
      status={t(`settings.ai.connectionResults.${connectionStatus}`)}
      statusTone={connectionStatus === "passed" ? "success" : "default"}
      icon={<KeyRound aria-hidden="true" />}
    >
      <section className="flex flex-col gap-4 border-b p-4 md:p-6" aria-label={t("settings.ai.providerRequest")}>
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">{t("settings.ai.providerRequest")}</h3>
          <p className="text-sm text-muted-foreground">{t("settings.ai.providerRequestDescription")}</p>
        </div>

        <div className="grid gap-4">
          <SettingsField id="base-url" label={t("settings.ai.baseUrlLabel")} description={t("settings.ai.baseUrlDescription")}>
            <Input
              id="base-url"
              type="url"
              name="base-url"
              value={settings.baseUrl}
              onChange={(event) => setSettings((currentSettings) => ({ ...currentSettings, baseUrl: event.target.value }))}
              autoComplete="url"
            />
          </SettingsField>

          <SettingsField id="api-key" label={t("settings.ai.apiKeyLabel")} description={t("settings.ai.apiKeyDescription")}>
            <InputGroup>
              <InputGroupInput
                id="api-key"
                type={isApiKeyVisible ? "text" : "password"}
                name="api-key"
                value={settings.apiKey}
                onChange={(event) => setSettings((currentSettings) => ({ ...currentSettings, apiKey: event.target.value }))}
                autoComplete="off"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  aria-label={t(isApiKeyVisible ? "settings.ai.hideApiKey" : "settings.ai.showApiKey")}
                  size="icon-xs"
                  onClick={() => setIsApiKeyVisible((visible) => !visible)}
                >
                  {isApiKeyVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </SettingsField>

          <SettingsField id="model" label={t("settings.ai.modelLabel")} description={t("settings.ai.modelDescription")}>
            <Input
              id="model"
              name="model"
              value={settings.model}
              onChange={(event) => setSettings((currentSettings) => ({ ...currentSettings, model: event.target.value }))}
              autoComplete="off"
            />
          </SettingsField>

          <PreferenceRow
            label={t("settings.ai.thinkingModeLabel")}
            description={t("settings.ai.thinkingModeDescription")}
            compact
          >
            <Switch
              id="thinking-mode"
              checked={settings.thinkingEnabled}
              onCheckedChange={(thinkingEnabled) => setSettings((currentSettings) => ({ ...currentSettings, thinkingEnabled }))}
              aria-label={t("settings.ai.thinkingModeLabel")}
              className="dark:data-unchecked:border-border dark:data-unchecked:bg-secondary"
            >
              <SwitchThumb className="dark:data-checked:bg-primary-foreground dark:data-unchecked:bg-muted-foreground" />
            </Switch>
          </PreferenceRow>
        </div>
      </section>

      <section className="flex flex-col gap-4 p-4 md:p-6" aria-label={t("settings.ai.connectionTest")}>
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">{t("settings.ai.connectionTest")}</h3>
          <p className="text-sm text-muted-foreground">{t("settings.ai.connectionTestDescription")}</p>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleTestConnection} disabled={connectionStatus === "testing"}>
            {t("settings.ai.testConnection")}
          </Button>
          <Button type="button" className="rounded-full px-4" onClick={handleSaveSettings}>
            {t("common.actions.saveChanges")}
          </Button>
        </div>
      </section>
    </ModuleShell>
  );
}

function StylePromptsModule() {
  const { t } = useTranslation();
  const [stylePrompts, setStylePrompts] = useState<StylePrompt[]>([]);
  const [editorState, setEditorState] = useState<StylePromptEditorState | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftPrompt, setDraftPrompt] = useState("");
  const [isConfirmingSave, setIsConfirmingSave] = useState(false);
  const isEditorOpen = editorState !== null;

  useEffect(() => {
    let isMounted = true;

    getSavedStylePrompts().then((savedPrompts) => {
      if (isMounted) {
        setStylePrompts(savedPrompts);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleUpdateStylePrompt(id: string, nextPrompt: { name: string; prompt: string }) {
    const nextStylePrompts = await updateStylePrompt(id, nextPrompt);

    setStylePrompts(nextStylePrompts);
  }

  async function handleDeleteStylePrompt(id: string) {
    const nextStylePrompts = await deleteStylePrompt(id);

    setStylePrompts(nextStylePrompts);
  }

  function openCreateEditor() {
    setDraftName("");
    setDraftPrompt("");
    setIsConfirmingSave(false);
    setEditorState({ mode: "create" });
  }

  function openEditEditor(stylePrompt: StylePrompt) {
    if (stylePrompt.source === "built-in") {
      openViewEditor(stylePrompt);
      return;
    }

    setDraftName(stylePrompt.name);
    setDraftPrompt(stylePrompt.prompt);
    setIsConfirmingSave(false);
    setEditorState({ mode: "edit", stylePrompt });
  }

  function openViewEditor(stylePrompt: StylePrompt) {
    setDraftName("");
    setDraftPrompt("");
    setIsConfirmingSave(false);
    setEditorState({ mode: "view", stylePrompt });
  }

  function closeEditor() {
    setIsConfirmingSave(false);
    setEditorState(null);
  }

  function handleRequestSaveStylePrompt() {
    if (!draftName.trim() || !draftPrompt.trim()) {
      return;
    }

    setIsConfirmingSave(true);
  }

  async function handleConfirmSaveStylePrompt() {
    if (!draftName.trim() || !draftPrompt.trim()) {
      return;
    }

    if (editorState?.mode === "edit") {
      await handleUpdateStylePrompt(editorState.stylePrompt.id, { name: draftName, prompt: draftPrompt });
    } else if (editorState?.mode === "create") {
      const nextStylePrompts = await addStylePrompt({ name: draftName, prompt: draftPrompt });

      setStylePrompts(nextStylePrompts);
    }

    closeEditor();
    toast.success(t("settings.savedToast"));
  }

  return (
    <ModuleShell
      title={t("settings.stylePrompts.title")}
      description={t("settings.stylePrompts.description")}
      icon={<Palette aria-hidden="true" />}
      contained
    >
      <ScrollArea className="min-h-0 flex-1 overflow-hidden overscroll-contain">
        <section className="grid gap-5 p-4 md:p-6" aria-label={t("settings.stylePrompts.addSection")}>
          <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-[0_1px_2px_rgb(17_24_39/0.03)] md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold">{t("settings.stylePrompts.addSection")}</h3>
              <p className="text-sm text-muted-foreground">{t("settings.stylePrompts.addDescription")}</p>
            </div>
            <Button type="button" className="rounded-full px-4" onClick={openCreateEditor}>
              <Plus data-icon="inline-start" />
              {t("settings.stylePrompts.addAction")}
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {stylePrompts.map((stylePrompt) => (
              <StylePromptCard
                key={stylePrompt.id}
                stylePrompt={stylePrompt}
                onView={openViewEditor}
                onEdit={openEditEditor}
                onDelete={handleDeleteStylePrompt}
              />
            ))}
          </div>
        </section>
      </ScrollArea>
      {isEditorOpen ? (
        <Drawer direction="right" open onOpenChange={(open) => {
          if (!open) {
            closeEditor();
          }
        }}>
          <DrawerContent className="w-[min(42rem,calc(100vw-1rem))] sm:max-w-none">
            <DrawerHeader className="border-b bg-muted/35">
              <DrawerTitle>{getStylePromptEditorTitle(editorState, t)}</DrawerTitle>
              <DrawerDescription>
                {getStylePromptEditorDescription(editorState, t)}
              </DrawerDescription>
            </DrawerHeader>
            <ScrollArea className="min-h-0 flex-1 overflow-hidden overscroll-contain">
              {editorState.mode === "view" ? (
                <div className="grid gap-3 p-4">
                  <p className="whitespace-pre-wrap break-words rounded-lg border bg-card p-4 font-mono text-sm leading-6 text-muted-foreground">
                    {getStylePromptDisplayPrompt(editorState.stylePrompt, t)}
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 p-4">
                  <SettingsField id="style-prompt-name" label={t("settings.stylePrompts.nameLabel")} description={t("settings.stylePrompts.nameDescription")}>
                    <Input
                      id="style-prompt-name"
                      name="style-prompt-name"
                      value={draftName}
                      onChange={(event) => {
                        setDraftName(event.target.value);
                        setIsConfirmingSave(false);
                      }}
                      autoComplete="off"
                    />
                  </SettingsField>

                  <SettingsField id="style-prompt" label={t("settings.stylePrompts.promptLabel")} description={t("settings.stylePrompts.promptDescription")}>
                    <Textarea
                      id="style-prompt"
                      name="style-prompt"
                      value={draftPrompt}
                      onChange={(event) => {
                        setDraftPrompt(event.target.value);
                        setIsConfirmingSave(false);
                      }}
                      className="min-h-[22rem] resize-y overflow-auto whitespace-pre-wrap font-mono text-sm leading-5"
                    />
                  </SettingsField>
                </div>
              )}
            </ScrollArea>
            <DrawerFooter className="border-t bg-card sm:flex-row sm:justify-end">
              <DrawerClose asChild>
                <Button type="button" variant="outline">
                  {t("common.actions.cancel")}
                </Button>
              </DrawerClose>
              {editorState.mode !== "view" ? (
                <>
                  {isConfirmingSave ? (
                    <p className="mr-auto self-center text-sm text-muted-foreground">{t("settings.stylePrompts.saveConfirmDescription")}</p>
                  ) : null}
                  {isConfirmingSave ? (
                    <Button type="button" className="rounded-full px-4" onClick={handleConfirmSaveStylePrompt}>
                      {t("settings.stylePrompts.confirmSaveAction")}
                    </Button>
                  ) : (
                    <Button type="button" className="rounded-full px-4" onClick={handleRequestSaveStylePrompt} disabled={!draftName.trim() || !draftPrompt.trim()}>
                      {t(editorState.mode === "edit" ? "settings.stylePrompts.saveAction" : "settings.stylePrompts.addAction")}
                    </Button>
                  )}
                </>
              ) : null}
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : null}
    </ModuleShell>
  );
}

function StylePromptCard({
  stylePrompt,
  onView,
  onEdit,
  onDelete,
}: {
  stylePrompt: StylePrompt;
  onView: (stylePrompt: StylePrompt) => void;
  onEdit: (stylePrompt: StylePrompt) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const isBuiltIn = stylePrompt.source === "built-in";
  const displayName = getStylePromptDisplayName(stylePrompt, t);
  const displayPrompt = getStylePromptDisplayPrompt(stylePrompt, t);

  return (
    <article
      aria-label={displayName}
      tabIndex={0}
      onClick={() => onView(stylePrompt)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onView(stylePrompt);
        }
      }}
      className={cn(
        "group flex min-h-36 cursor-pointer flex-col overflow-hidden rounded-lg border bg-card p-4 shadow-[0_1px_2px_rgb(17_24_39/0.03)] transition-[border-color,box-shadow,transform] outline-none hover:-translate-y-px hover:shadow-[0_10px_28px_rgb(17_24_39/0.07)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        isBuiltIn
          ? "border-[color-mix(in_srgb,var(--ring),var(--border)_72%)]"
          : "border-border"
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold leading-6">{displayName}</h3>
          <span className={cn(
            "mt-1 inline-flex h-5 items-center rounded-md px-1.5 text-xs font-medium",
            isBuiltIn
              ? "bg-accent text-accent-foreground"
              : "bg-secondary text-muted-foreground"
          )}>
            {t(isBuiltIn ? "settings.stylePrompts.builtInBadge" : "settings.stylePrompts.customBadge")}
          </span>
        </div>
        {!isBuiltIn ? (
          <div className="flex shrink-0 items-center gap-1 opacity-80 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("settings.stylePrompts.editAction", { name: stylePrompt.name })}
              onClick={(event) => {
                event.stopPropagation();
                onEdit(stylePrompt);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("settings.stylePrompts.deleteAction", { name: stylePrompt.name })}
              onClick={(event) => {
                event.stopPropagation();
                void onDelete(stylePrompt.id);
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        ) : null}
      </div>
      <p className="mt-5 line-clamp-4 overflow-hidden border-t pt-3 text-sm leading-6 whitespace-pre-wrap break-words text-muted-foreground">
        {displayPrompt}
      </p>
    </article>
  );
}

function getStylePromptEditorTitle(editorState: StylePromptEditorState, t: ReturnType<typeof useTranslation>["t"]): string {
  if (editorState.mode === "view") {
    return getStylePromptDisplayName(editorState.stylePrompt, t);
  }

  return t(editorState.mode === "edit" ? "settings.stylePrompts.editDrawerTitle" : "settings.stylePrompts.addSection");
}

function getStylePromptEditorDescription(editorState: StylePromptEditorState, t: ReturnType<typeof useTranslation>["t"]): string {
  if (editorState.mode === "view") {
    return t("settings.stylePrompts.viewDrawerDescription");
  }

  return t(editorState.mode === "edit" ? "settings.stylePrompts.editDrawerDescription" : "settings.stylePrompts.addDescription");
}

function getStylePromptDisplayName(stylePrompt: StylePrompt, t: ReturnType<typeof useTranslation>["t"]): string {
  return stylePrompt.source === "built-in" ? t(`settings.stylePrompts.builtIns.${stylePrompt.id}.name`) : stylePrompt.name;
}

function getStylePromptDisplayPrompt(stylePrompt: StylePrompt, t: ReturnType<typeof useTranslation>["t"]): string {
  return stylePrompt.source === "built-in" ? t(`settings.stylePrompts.builtIns.${stylePrompt.id}.prompt`) : stylePrompt.prompt;
}

function toAISettings(settings: AISettings): AISettings {
  return {
    baseUrl: settings.baseUrl,
    apiKey: settings.apiKey,
    model: settings.model,
    thinkingEnabled: settings.thinkingEnabled,
  };
}

function LocalDataModule() {
  const { t } = useTranslation();
  const historyRecords = useWorkspaceStore((state) => state.historyRecords);
  const usage = estimateHistoryStorageUsage(historyRecords);

  return (
    <ModuleShell
      title={t("settings.localData.title")}
      description={t("settings.localData.description")}
      status={t("settings.localData.status")}
      icon={<Database aria-hidden="true" />}
    >
      <section className="flex flex-col gap-4 p-4 md:p-6" aria-label={t("settings.localData.storageEstimate")}>
        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard value={formatStorageBytes(usage.bytes)} label={t("settings.localData.historyStorage")} />
          <MetricCard value={String(usage.recordCount)} label={t("settings.localData.savedRecords")} />
          <MetricCard value={String(usage.apiKeysInHistory)} label={t("settings.localData.apiKeysInHistory")} />
        </div>

        <Progress value={Math.round(usage.usageRatio * 100)}>
          <ProgressLabel>{t("settings.localData.storageUsageMeter")}</ProgressLabel>
          <span className="ml-auto text-sm text-muted-foreground tabular-nums">{t("settings.localData.estimateOnly")}</span>
        </Progress>
      </section>
    </ModuleShell>
  );
}

function PerformanceModule() {
  const { t } = useTranslation();
  const [uiLanguagePreference, setUiLanguagePreference] = useState<UiLanguagePreference>("browser");
  const [themePreference, setThemePreference] = useState<WorkspaceThemePreference>("System");

  useEffect(() => {
    let isMounted = true;

    Promise.all([getSavedUiLanguagePreference(), getSavedThemePreference()]).then(([languagePreference, savedThemePreference]) => {
      if (isMounted) {
        setUiLanguagePreference(languagePreference);
        setThemePreference(savedThemePreference);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ModuleShell
      title={t("settings.performance.title")}
      description={t("settings.performance.description")}
      icon={<BarChart3 aria-hidden="true" />}
    >
      <section className="flex flex-col p-4 md:p-6" aria-label={t("settings.display")}>
        <PreferenceRow
          label={t("settings.preferences.uiLanguageLabel")}
          description={t("settings.preferences.uiLanguageDescription")}
        >
          <CompactSegmentedControl
            ariaLabel={t("settings.preferences.uiLanguageLabel")}
            options={[
              { value: "browser", label: t("settings.preferences.browser"), ariaLabel: t("settings.preferences.followBrowserLanguage") },
              { value: "en", label: "English" },
              { value: "zh-CN", label: "简体中文" },
            ]}
            activeOption={uiLanguagePreference}
            onChange={(value) => setUiLanguagePreference(value as UiLanguagePreference)}
          />
        </PreferenceRow>

        <PreferenceRow label={t("settings.preferences.themeLabel")} description={t("settings.preferences.themeDescription")}>
          <CompactSegmentedControl
            ariaLabel={t("settings.preferences.themeLabel")}
            options={[
              { value: "System", label: t("settings.preferences.system") },
              { value: "Light", label: t("settings.preferences.light") },
              { value: "Dark", label: t("settings.preferences.dark") },
            ]}
            activeOption={themePreference}
            onChange={(value) => setThemePreference(value as WorkspaceThemePreference)}
          />
        </PreferenceRow>

        <div className="flex justify-end border-t pt-4">
          <Button
            type="button"
            className="rounded-full px-4"
            onClick={async () => {
              await Promise.all([
                applyUiLanguagePreference(uiLanguagePreference),
                applyThemePreference(themePreference),
              ]);
              toast.success(t("settings.savedToast"));
            }}
          >
            {t("settings.saveChanges")}
          </Button>
        </div>
      </section>
    </ModuleShell>
  );
}

function ModuleShell({
  title,
  description,
  status,
  statusTone = "default",
  icon,
  contained = false,
  children,
}: {
  title: string;
  description: string;
  status?: string;
  statusTone?: "default" | "success";
  icon: React.ReactNode;
  contained?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article className={cn(
      "w-full mx-auto max-w-4xl overflow-hidden rounded-lg border bg-card shadow-[0_1px_2px_rgb(17_24_39/0.04)]",
      contained ? "flex h-full min-h-0 flex-col" : null
    )}>
      <header className="flex flex-col gap-3 border-b bg-muted/20 p-4 md:flex-row md:items-start md:justify-between md:p-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground ring-1 ring-ring/20">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {status ? (
          <div
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5 text-sm",
              statusTone === "success" ? "border-ring/30 bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
          >
            <ShieldCheck aria-hidden="true" />
            {status}
          </div>
        ) : null}
      </header>
      {children}
    </article>
  );
}

function SettingsField({ id, label, description, children }: { id: string; label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <div className="grid gap-1">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-[0_1px_2px_rgb(17_24_39/0.03)]">
      <p className="text-2xl font-semibold tracking-normal">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function PreferenceRow({ label, description, children, compact = false }: { label: string; description: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <div className={cn(
      "grid gap-3 border-b py-4 first:pt-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center",
      compact ? "rounded-lg border bg-card px-3 py-3 first:pt-3" : null
    )}>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
      </div>
      <div className="min-w-0 md:justify-self-end">{children}</div>
    </div>
  );
}

function CompactSegmentedControl({
  ariaLabel,
  options,
  activeOption,
  onChange,
}: {
  ariaLabel: string;
  options: { value: string; label: string; ariaLabel?: string }[];
  activeOption: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="inline-flex max-w-full rounded-full border bg-muted p-1" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          aria-label={option.ariaLabel ?? option.label}
          aria-pressed={option.value === activeOption}
          onClick={() => onChange?.(option.value)}
          className={cn(
            "h-7 min-w-20 rounded-full px-3 text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
            option.value === activeOption
              ? "bg-card text-foreground shadow-sm ring-1 ring-border/70"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
