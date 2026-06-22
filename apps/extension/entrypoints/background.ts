export default defineBackground(() => {
  browser.action.onClicked.addListener(async () => {
    const workspaceUrl = browser.runtime.getURL("/workspace.html");
    const tabs = await browser.tabs.query({ url: workspaceUrl });
    const existingTab = tabs[0];

    if (existingTab?.id) {
      await browser.tabs.update(existingTab.id, { active: true });
      if (existingTab.windowId) {
        await browser.windows.update(existingTab.windowId, { focused: true });
      }
      return;
    }

    await browser.tabs.create({ url: workspaceUrl });
  });
});
