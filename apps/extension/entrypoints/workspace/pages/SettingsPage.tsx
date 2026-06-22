import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Database,
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { testAIConnection } from "../ai-connection";
import { getSavedAISettings, saveAISettings, type AISettings } from "../ai-settings";
import { applyUiLanguagePreference, getSavedUiLanguagePreference, type UiLanguagePreference } from "../i18n";

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
  const [connectionResult, setConnectionResult] = useState<"not-tested" | "testing" | "passed" | "failed">("not-tested");
  const [connectionError, setConnectionError] = useState("");

  useEffect(() => {
    let isMounted = true;

    getSavedAISettings().then((savedSettings) => {
      if (isMounted) {
        setSettings(savedSettings);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSaveSettings() {
    const savedSettings = await saveAISettings(settings);
    setSettings(savedSettings);
  }

  async function handleTestConnection() {
    const savedSettings = await saveAISettings(settings);
    setSettings(savedSettings);
    setConnectionError("");
    setConnectionResult("testing");

    const result = await testAIConnection(savedSettings);

    if (result.ok) {
      setConnectionResult("passed");
      return;
    }

    setConnectionResult("failed");
    setConnectionError(result.error);
  }

  return (
    <ModuleShell
      title={t("settings.ai.title")}
      description={t("settings.ai.description")}
      status={t("settings.ai.status")}
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
                type="password"
                name="api-key"
                value={settings.apiKey}
                onChange={(event) => setSettings((currentSettings) => ({ ...currentSettings, apiKey: event.target.value }))}
                autoComplete="off"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton aria-label={t("settings.ai.hideApiKey")} size="icon-xs">
                  <EyeOff aria-hidden="true" />
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

        <div className="grid gap-3 md:grid-cols-2">
          <StatusRow label={t("settings.ai.lastResult")} value={t(`settings.ai.connectionResults.${connectionResult}`)} />
          <StatusRow label={t("settings.ai.errorHandling")} value={connectionError || t("settings.ai.noError")} />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleTestConnection} disabled={connectionResult === "testing"}>
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

function LocalDataModule() {
  const { t } = useTranslation();

  return (
    <ModuleShell
      title={t("settings.localData.title")}
      description={t("settings.localData.description")}
      status={t("settings.localData.status")}
      icon={<Database aria-hidden="true" />}
    >
      <section className="flex flex-col gap-4 p-4 md:p-6" aria-label={t("settings.localData.storageEstimate")}>
        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard value="18.4 MB" label={t("settings.localData.historyStorage")} />
          <MetricCard value="42" label={t("settings.localData.savedRecords")} />
          <MetricCard value="0" label={t("settings.localData.apiKeysInHistory")} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">{t("settings.localData.storageUsageMeter")}</span>
            <span className="text-muted-foreground">{t("settings.localData.estimateOnly")}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/3 rounded-full bg-primary" />
          </div>
        </div>
      </section>
    </ModuleShell>
  );
}

function PerformanceModule() {
  const { t } = useTranslation();
  const [uiLanguagePreference, setUiLanguagePreference] = useState<UiLanguagePreference>("browser");

  useEffect(() => {
    let isMounted = true;

    getSavedUiLanguagePreference().then((preference) => {
      if (isMounted) {
        setUiLanguagePreference(preference);
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
            activeOption="Light"
          />
        </PreferenceRow>

        <div className="flex justify-end border-t pt-4">
          <Button type="button" onClick={() => applyUiLanguagePreference(uiLanguagePreference)}>
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
  icon,
  children,
}: {
  title: string;
  description: string;
  status?: string;
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
          <div className="inline-flex shrink-0 items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5 text-sm text-muted-foreground">
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

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="inline-flex items-center gap-2 font-medium">
        <CheckCircle2 aria-hidden="true" />
        {value}
      </span>
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
