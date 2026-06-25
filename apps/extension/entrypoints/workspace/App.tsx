import { useEffect, useState } from "react";

import { initWorkspaceI18n } from "./i18n";
import { SettingsPage } from "./pages/SettingsPage";
import { WorkspacePage } from "./pages/WorkspacePage";
import { applySavedThemePreference } from "./theme-preference";
import { getSavedTranslationHistoryRecords } from "./translation-history";
import { useWorkspaceStore } from "./workspace-store";
// import { ScrollArea } from "@/components/ui/scroll-area"
// import React from "react";
// import { Separator } from "@/components/ui/separator";

type WorkspaceRoute = "workspace" | "settings";

function App() {
  const [isI18nReady, setIsI18nReady] = useState(false);
  const [route, setRoute] = useState<WorkspaceRoute>(() => getWorkspaceRoute());

  const tags = Array.from({ length: 50 }).map(
    (_, i, a) => `v1.2.0-beta.${a.length - i}`
  )

  // return (
  //   <>
  //     <ScrollArea className="h-72 w-48 rounded-md border">
  //       <div className="p-4">
  //         <h4 className="mb-4 text-sm leading-none font-medium">Tags</h4>
  //         {tags.map((tag) => (
  //           <React.Fragment key={tag}>
  //             <div className="text-sm">{tag}</div>
  //             <Separator className="my-2" />
  //           </React.Fragment>
  //         ))}
  //       </div>
  //     </ScrollArea>
  //   </>
  // )

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
