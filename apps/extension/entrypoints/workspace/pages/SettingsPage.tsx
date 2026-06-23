import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Languages,
  MonitorCog,
  PlugZap,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress, ProgressLabel } from "@/components/ui/progress";
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
import { applyThemePreference, getSavedThemePreference, type WorkspaceThemePreference } from "../theme-preference";
import { estimateHistoryStorageUsage, formatStorageBytes } from "../translation-history";
import { useWorkspaceStore } from "../workspace-store";

type SettingsModule = "ai" | "local-data" | "performance";

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
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="grid shrink-0 grid-cols-1 gap-3 border-b bg-card px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:px-6" role="banner">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
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
            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium whitespace-nowrap transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ArrowLeft data-icon="inline-start" />
            {t("settings.workspace")}
          </a>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 justify-center px-4 py-4 md:px-6">
        <div className="grid min-h-0 w-full max-w-[1200px] grid-cols-1 overflow-hidden rounded-lg border md:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="border-b bg-card md:border-b-0 md:border-r" aria-label={t("settings.menu")}>
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
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-transparent hover:border-border hover:bg-muted"
                    )}
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-background/80 text-foreground">
                      {module.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{t(module.labelKey)}</span>
                      <span className={cn("block truncate text-xs", activeModule === module.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        {t(module.descriptionKey)}
                      </span>
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <section className="min-w-0 overflow-auto p-4 md:p-6" aria-label={t("settings.activeModule")}>
            {activeModule === "ai" ? <AISettingsModule /> : null}
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
          <Button type="button" onClick={handleSaveSettings}>
            {t("common.actions.saveChanges")}
          </Button>
        </div>
      </section>
    </ModuleShell>
  );
}

function toAISettings(settings: AISettings): AISettings {
  return {
    baseUrl: settings.baseUrl,
    apiKey: settings.apiKey,
    model: settings.model,
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
  const [themePreference, setThemePreference] = useState<WorkspaceThemePreference>("Light");

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
            onClick={() => {
              void applyUiLanguagePreference(uiLanguagePreference);
              void applyThemePreference(themePreference);
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
  children,
}: {
  title: string;
  description: string;
  status?: string;
  statusTone?: "default" | "success";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-4xl overflow-hidden rounded-lg border bg-card">
      <header className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-start md:justify-between md:p-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
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
              "inline-flex shrink-0 items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5 text-sm",
              statusTone === "success" ? "border-green-200 bg-green-50 text-green-700" : "text-muted-foreground"
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
    <div className="rounded-lg border bg-background p-4">
      <p className="text-2xl font-semibold tracking-normal">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function PreferenceRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 border-b py-4 first:pt-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
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
    <div className="inline-flex max-w-full rounded-lg border bg-muted p-1" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          aria-label={option.ariaLabel ?? option.label}
          aria-pressed={option.value === activeOption}
          onClick={() => onChange?.(option.value)}
          className={cn(
            "h-7 min-w-20 rounded-md px-3 text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
            option.value === activeOption
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
