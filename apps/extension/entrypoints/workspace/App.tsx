import { useEffect, useState } from "react";

import { initWorkspaceI18n } from "./i18n";
import { SettingsPage } from "./pages/SettingsPage";
import { WorkspacePage } from "./pages/WorkspacePage";
import { applySavedThemePreference } from "./theme-preference";
import { getSavedTranslationHistoryRecords } from "./translation-history";
import { useWorkspaceStore } from "./workspace-store";

type WorkspaceRoute = "workspace" | "settings";

function App() {
  const [isI18nReady, setIsI18nReady] = useState(false);
  const [route, setRoute] = useState<WorkspaceRoute>(() => getWorkspaceRoute());

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      initWorkspaceI18n(),
      applySavedThemePreference(),
      getSavedTranslationHistoryRecords(),
    ]).then(([, , savedHistoryRecords]) => {
      if (isMounted) {
        useWorkspaceStore.getState().hydrateHistoryRecords(savedHistoryRecords);
        setIsI18nReady(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleHashChange = () => setRoute(getWorkspaceRoute());

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (!isI18nReady) {
    return null;
  }

  if (route === "settings") {
    return <SettingsPage />;
  }

  return <WorkspacePage onOpenSettings={() => navigateToRoute("settings", setRoute)} />;
}

function getWorkspaceRoute(): WorkspaceRoute {
  return window.location.hash === "#settings" ? "settings" : "workspace";
}

function navigateToRoute(route: WorkspaceRoute, setRoute: (route: WorkspaceRoute) => void) {
  window.location.hash = route === "settings" ? "settings" : "";
  setRoute(route);
}

export default App;
