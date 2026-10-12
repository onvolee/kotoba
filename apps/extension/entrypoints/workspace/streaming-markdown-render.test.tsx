import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ContentViewer } from "./pages/WorkspacePage";
import { useWorkspaceStore } from "./workspace-store";

/**
 * Guards against "Minified React error #185" (Maximum update depth exceeded) during
 * translation streaming.
 *
 * streamdown <= 2.5.x promoted every streamed block change through an internal setState
 * (vercel/streamdown#550, vercel/streamdown#592). When translation chunks arrived in a
 * burst, each chunk commit left that internal update pending, so React's nested update
 * counter climbed past its limit; the next workspace store update then threw React error
 * #185 inside the streaming loop and surfaced as a failed translation.
 */
describe("streamed markdown rendering", () => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    useWorkspaceStore.getState().resetWorkspaceStateForTests();
  });

  afterEach(() => {
    root?.unmount();
    container?.remove();
    root = null;
    container = null;
    delete (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
  });

  it("keeps updating while translation chunks stream in as a burst", async () => {
    // The real scheduler is required here: act() flushes to quiescence after every update
    // and resets React's nested update counter, which hides the problem.
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;

    const translatedDocument = buildTranslatedDocument();

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    useWorkspaceStore.getState().setTranslationContent("# 生产环境部署\n");
    root.render(<TranslationPanel />);
    await waitForContent(container, "生产环境部署");
    await new Promise((resolve) => setTimeout(resolve, 0));

    let streamingError: unknown = null;

    for (let end = 6; end <= translatedDocument.length; end += 6) {
      try {
        useWorkspaceStore.getState().setTranslationContent(translatedDocument.slice(0, end));
      } catch (error) {
        streamingError = error;
        break;
      }

      // Mirrors the async generator loop in WorkspacePage.handleTranslate: every chunk
      // update is consumed in a microtask, well before the browser reaches the next task.
      await Promise.resolve();
    }

    expect(streamingError).toBeNull();
    expect(container.textContent).toContain("生产环境的 OIDC 角色必须由账号本地配置");
  });
});

function TranslationPanel() {
  const content = useWorkspaceStore((state) => state.translationContent);

  return (
    <ContentViewer
      ariaLabel="Translation output"
      content={content}
      contentFormat="Markdown"
      viewFormat="Markdown"
    />
  );
}

function buildTranslatedDocument(): string {
  const paragraphs: string[] = ["# 生产环境部署\n"];

  for (let index = 0; index < 60; index += 1) {
    paragraphs.push(
      `第 ${index + 1} 段：生产环境的 OIDC 角色必须由账号本地配置，并且只能通过 release tag 触发部署。\n`,
    );
  }

  return paragraphs.join("\n");
}

async function waitForContent(container: HTMLElement, expected: string): Promise<void> {
  const deadline = Date.now() + 2000;

  while (!container.textContent?.includes(expected) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  expect(container.textContent).toContain(expected);
}
