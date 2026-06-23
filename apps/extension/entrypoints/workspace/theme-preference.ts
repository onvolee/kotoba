import { storage } from "wxt/utils/storage";

export type WorkspaceThemePreference = "Light" | "Dark";

const themePreferenceKey = "local:theme-preference";

export async function getSavedThemePreference(): Promise<WorkspaceThemePreference> {
  const value = await storage.getItem<WorkspaceThemePreference>(themePreferenceKey, {
    fallback: "Light",
  });

  return isThemePreference(value) ? value : "Light";
}

export async function applyThemePreference(preference: WorkspaceThemePreference) {
  await storage.setItem(themePreferenceKey, preference);
  applyThemeClass(preference);
}

export async function applySavedThemePreference() {
  applyThemeClass(await getSavedThemePreference());
}

function applyThemeClass(preference: WorkspaceThemePreference) {
  document.documentElement.classList.toggle("dark", preference === "Dark");
}

function isThemePreference(value: unknown): value is WorkspaceThemePreference {
  return value === "Light" || value === "Dark";
}
