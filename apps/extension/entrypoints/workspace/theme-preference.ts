import { storage } from "wxt/utils/storage";

export type WorkspaceThemePreference = "System" | "Light" | "Dark";

const themePreferenceKey = "local:theme-preference";

export async function getSavedThemePreference(): Promise<WorkspaceThemePreference> {
  const value = await storage.getItem<WorkspaceThemePreference>(themePreferenceKey, {
    fallback: "System",
  });

  return isThemePreference(value) ? value : "System";
}

export async function applyThemePreference(preference: WorkspaceThemePreference) {
  await storage.setItem(themePreferenceKey, preference);
  applyThemeClass(preference);
}

export async function applySavedThemePreference() {
  applyThemeClass(await getSavedThemePreference());
}

function applyThemeClass(preference: WorkspaceThemePreference) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", preference === "Dark" || (preference === "System" && prefersDark));
}

function isThemePreference(value: unknown): value is WorkspaceThemePreference {
  return value === "System" || value === "Light" || value === "Dark";
}
