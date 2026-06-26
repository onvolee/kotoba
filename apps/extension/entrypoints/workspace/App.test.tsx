import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing";
import { Toaster } from "@/components/ui/sonner";
import App from "./App";
import { resetWorkspaceI18nForTests } from "./i18n";
import { ContentViewer } from "./pages/WorkspacePage";
import { saveAISettings } from "./ai-settings";
import {
  getSavedTranslationHistoryRecords,
  saveTranslationHistoryRecords,
  type TranslationHistoryRecord,
} from "./translation-history";
import { useWorkspaceStore } from "./workspace-store";

const connectionMocks = vi.hoisted(() => ({
  testAIConnection: vi.fn(),
}));

const translationMocks = vi.hoisted(() => ({
  translateSourceContent: vi.fn(),
}));

vi.mock("./ai-connection", () => ({
  testAIConnection: connectionMocks.testAIConnection,
}));

vi.mock("./translation-service", () => ({
  translateSourceContent: translationMocks.translateSourceContent,
}));

describe("workspace shell", () => {
  beforeEach(() => {
    window.location.hash = "";
    fakeBrowser.reset();
    connectionMocks.testAIConnection.mockReset();
    connectionMocks.testAIConnection.mockResolvedValue({ ok: true });
    translationMocks.translateSourceContent.mockReset();
    translationMocks.translateSourceContent.mockImplementation(async function* () {
      yield { type: "text", text: "# 默认译文" };
    });
    useWorkspaceStore.getState().resetWorkspaceStateForTests();
    setBrowserLanguage("en-US");
    resetWorkspaceI18nForTests();
  });

  it("follows the browser Simplified Chinese language when no UI language preference is saved", async () => {
    setBrowserLanguage("zh-CN");

    render(<App />);

    expect(await screen.findByRole("button", { name: "翻译" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "打开设置" })).toBeInTheDocument();
  });

  it("localizes workspace controls and status text into Simplified Chinese", async () => {
    setBrowserLanguage("zh-CN");

    render(<App />);

    expect(await screen.findByRole("button", { name: "翻译方向：英语到中文" })).toBeInTheDocument();
    expect(within(screen.getByRole("form", { name: "翻译控制" })).getByRole("combobox", { name: "翻译提示词风格" })).toHaveValue("编程技术");
    expect(within(screen.getByRole("region", { name: "原文" })).getByRole("group", { name: "原文显示模式" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "译文" })).getByRole("group", { name: "译文显示模式" })).toBeInTheDocument();
    expect(screen.getByText("输入：Markdown")).toBeInTheDocument();
    expect(screen.getByText("成功翻译会保存在本地")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "上传" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "原文" })).getByRole("button", { name: "清空" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "译文" })).getByRole("button", { name: "清空" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "停止" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下载 .zh.md" })).toBeInTheDocument();
    expect(screen.getByText("在这里粘贴 Markdown 或纯文本，也可以上传 .md 或 .txt 文件。")).toBeInTheDocument();
    expect(screen.getByText("开始翻译后，译文会显示在这里。")).toBeInTheDocument();
  });

  it("localizes settings modules and preferences into Simplified Chinese", async () => {
    const user = userEvent.setup();
    setBrowserLanguage("zh-CN");

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "打开设置" }));

    expect(screen.getByRole("heading", { name: "性能", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /AI 设置/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /本地数据/ })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "显示" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "界面语言" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "跟随浏览器语言" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "主题" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "浅色" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "深色" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /风格提示词/ }));
    expect(screen.getByRole("article", { name: "编程技术" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "通用" })).toBeInTheDocument();
  });

  it("lets users manage AI style prompts from settings", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Open settings" }));
    await user.click(screen.getByRole("button", { name: /Style prompts/ }));

    expect(screen.getByRole("heading", { name: "Style prompts", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Programming technology" })).toHaveTextContent("professional translator specializing in programming");
    expect(screen.getByRole("article", { name: "General" })).toHaveTextContent("Use clear, natural wording for general reading");

    await user.click(screen.getByRole("button", { name: "Add style prompt" }));

    const promptEditor = await screen.findByRole("dialog", { name: "New style prompt" });
    await user.type(within(promptEditor).getByLabelText("Style name"), "Release notes");
    await user.type(within(promptEditor).getByLabelText("Prompt"), "Translate release notes with concise product language.");
    await user.click(within(promptEditor).getByRole("button", { name: "Add style prompt" }));

    expect(screen.getByRole("article", { name: "Release notes" })).toHaveTextContent("Translate release notes with concise product language.");
    expect(screen.queryByRole("dialog", { name: "New style prompt" })).not.toBeInTheDocument();
  });

  it("shows saved custom style prompts when settings is opened again", async () => {
    const user = userEvent.setup();
    const firstRender = render(<App />);

    await user.click(await screen.findByRole("button", { name: "Open settings" }));
    await user.click(screen.getByRole("button", { name: /Style prompts/ }));
    await user.click(screen.getByRole("button", { name: "Add style prompt" }));

    const promptEditor = await screen.findByRole("dialog", { name: "New style prompt" });
    await user.type(within(promptEditor).getByLabelText("Style name"), "Support reply");
    await user.type(within(promptEditor).getByLabelText("Prompt"), "Use concise, friendly support language.");
    await user.click(within(promptEditor).getByRole("button", { name: "Add style prompt" }));

    firstRender.unmount();
    window.location.hash = "#settings";
    resetWorkspaceI18nForTests();

    render(<App />);
    await user.click(await screen.findByRole("button", { name: /Style prompts/ }));

    expect(await screen.findByRole("article", { name: "Support reply" })).toHaveTextContent("Use concise, friendly support language.");
  });

  it("lets users edit and delete custom style prompts", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Open settings" }));
    await user.click(screen.getByRole("button", { name: /Style prompts/ }));
    await user.click(screen.getByRole("button", { name: "Add style prompt" }));

    const createEditor = await screen.findByRole("dialog", { name: "New style prompt" });
    await user.type(within(createEditor).getByLabelText("Style name"), "Draft voice");
    await user.type(within(createEditor).getByLabelText("Prompt"), "Use draft wording.");
    await user.click(within(createEditor).getByRole("button", { name: "Add style prompt" }));

    const customCard = screen.getByRole("article", { name: "Draft voice" });
    await user.click(within(customCard).getByRole("button", { name: "Edit Draft voice" }));

    const editEditor = await screen.findByRole("dialog", { name: "Edit style prompt" });
    await user.clear(within(editEditor).getByLabelText("Style name"));
    await user.type(within(editEditor).getByLabelText("Style name"), "Review voice");
    await user.clear(within(editEditor).getByLabelText("Prompt"));
    await user.type(within(editEditor).getByLabelText("Prompt"), "Use precise review language.");
    await user.click(within(editEditor).getByRole("button", { name: "Save style prompt" }));

    expect(screen.getByRole("article", { name: "Review voice" })).toHaveTextContent("Use precise review language.");
    expect(screen.queryByRole("article", { name: "Draft voice" })).not.toBeInTheDocument();

    await user.click(within(screen.getByRole("article", { name: "Review voice" })).getByRole("button", { name: "Delete Review voice" }));

    expect(screen.queryByRole("article", { name: "Review voice" })).not.toBeInTheDocument();
  });

  it("shows the settings route with display preferences and a workspace return", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Open settings" }));

    expect(screen.getByRole("heading", { name: "Settings", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Performance" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Display" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "UI language" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Theme" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to workspace" })).toHaveAttribute("href", "#");
  });

  it("shows local history storage usage from the current history data", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Open settings" }));
    await user.click(screen.getByRole("button", { name: /Local data/ }));

    expect(screen.getByText("saved records")).toBeInTheDocument();
    expect(screen.getAllByText("0")).toHaveLength(2);
    expect(screen.getByText("API keys in history")).toBeInTheDocument();
    expect(screen.getByText(/KB|MB|B/)).toBeInTheDocument();
    expect(screen.queryByText("18.4 MB")).not.toBeInTheDocument();
  });

  it("saves AI provider settings and shows them when settings is opened again", async () => {
    const user = userEvent.setup();
    const firstRender = render(<App />);

    await user.click(await screen.findByRole("button", { name: "Open settings" }));
    await user.click(screen.getByRole("button", { name: /AI settings/ }));

    await user.clear(screen.getByLabelText("Base URL"));
    await user.type(screen.getByLabelText("Base URL"), " https://api.example.com/v1/ ");
    await user.clear(screen.getByLabelText("API Key"));
    await user.type(screen.getByLabelText("API Key"), "sk-real-key");
    await user.clear(screen.getByLabelText("Model"));
    await user.type(screen.getByLabelText("Model"), "example-chat");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    firstRender.unmount();
    window.location.hash = "#settings";
    resetWorkspaceI18nForTests();

    render(<App />);
    await user.click(await screen.findByRole("button", { name: /AI settings/ }));

    await waitFor(() => expect(screen.getByLabelText("Base URL")).toHaveValue("https://api.example.com/v1"));
    expect(screen.getByLabelText("API Key")).toHaveValue("sk-real-key");
    expect(screen.getByLabelText("Model")).toHaveValue("example-chat");
  });

  it("shows a toast after saving AI provider settings", async () => {
    const user = userEvent.setup();

    renderAppWithToaster();

    await user.click(await screen.findByRole("button", { name: "Open settings" }));
    await user.click(screen.getByRole("button", { name: /AI settings/ }));

    await user.type(screen.getByLabelText("Base URL"), "https://api.example.com/v1");
    await user.type(screen.getByLabelText("API Key"), "sk-real-key");
    await user.type(screen.getByLabelText("Model"), "example-chat");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Settings saved")).toBeInTheDocument();
  });

  it("shows a toast after saving display preferences", async () => {
    const user = userEvent.setup();

    renderAppWithToaster();

    await user.click(await screen.findByRole("button", { name: "Open settings" }));
    await user.click(screen.getByRole("button", { name: "Dark" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Settings saved")).toBeInTheDocument();
  });

  it("shows a toast after saving a style prompt", async () => {
    const user = userEvent.setup();

    renderAppWithToaster();

    await user.click(await screen.findByRole("button", { name: "Open settings" }));
    await user.click(screen.getByRole("button", { name: /Style prompts/ }));
    await user.click(screen.getByRole("button", { name: "Add style prompt" }));

    const promptEditor = await screen.findByRole("dialog", { name: "New style prompt" });
    await user.type(within(promptEditor).getByLabelText("Style name"), "Release notes");
    await user.type(within(promptEditor).getByLabelText("Prompt"), "Translate release notes with concise product language.");
    await user.click(within(promptEditor).getByRole("button", { name: "Add style prompt" }));

    expect(await screen.findByText("Settings saved")).toBeInTheDocument();
  });

  it("saves thinking mode with AI provider settings", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Open settings" }));
    await user.click(screen.getByRole("button", { name: /AI settings/ }));

    await user.type(screen.getByLabelText("Base URL"), "https://api.example.com/v1");
    await user.type(screen.getByLabelText("API Key"), "sk-real-key");
    await user.type(screen.getByLabelText("Model"), "example-chat");
    await user.click(screen.getByRole("switch", { name: "Thinking mode" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await user.click(screen.getByRole("link", { name: "Back to workspace" }));
    await user.click(screen.getByRole("button", { name: "Open settings" }));
    await user.click(screen.getByRole("button", { name: /AI settings/ }));

    expect(await screen.findByRole("switch", { name: "Thinking mode" })).toBeChecked();
  });

  it("toggles API key visibility in AI provider settings", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Open settings" }));
    await user.click(screen.getByRole("button", { name: /AI settings/ }));

    const apiKeyInput = screen.getByLabelText("API Key");
    expect(apiKeyInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show API key" }));

    expect(apiKeyInput).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Hide API key" }));

    expect(apiKeyInput).toHaveAttribute("type", "password");
  });

  it("tests the current AI provider settings and persists a successful connection status", async () => {
    const user = userEvent.setup();
    const firstRender = render(<App />);

    await user.click(await screen.findByRole("button", { name: "Open settings" }));
    await user.click(screen.getByRole("button", { name: /AI settings/ }));
    await user.type(screen.getByLabelText("Base URL"), " https://api.example.com/v1/ ");
    await user.type(screen.getByLabelText("API Key"), "sk-real-key");
    await user.type(screen.getByLabelText("Model"), "example-chat");
    expect(screen.queryByText("Last result")).not.toBeInTheDocument();
    expect(screen.queryByText("Error handling")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Test connection" }));

    await waitFor(() => expect(screen.getByText("Connection passed")).toBeInTheDocument());
    expect(connectionMocks.testAIConnection).toHaveBeenCalledWith(expect.objectContaining({
      baseUrl: "https://api.example.com/v1",
      apiKey: "sk-real-key",
      model: "example-chat",
    }));

    firstRender.unmount();
    window.location.hash = "#settings";
    resetWorkspaceI18nForTests();

    render(<App />);
    await user.click(await screen.findByRole("button", { name: /AI settings/ }));

    expect(await screen.findByText("Connection passed")).toBeInTheDocument();
  });

  it("keeps the saved connection status when settings are edited and saved without testing again", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Open settings" }));
    await user.click(screen.getByRole("button", { name: /AI settings/ }));
    await user.type(screen.getByLabelText("Base URL"), "https://api.example.com/v1");
    await user.type(screen.getByLabelText("API Key"), "sk-real-key");
    await user.type(screen.getByLabelText("Model"), "example-chat");
    await user.click(screen.getByRole("button", { name: "Test connection" }));

    await waitFor(() => expect(screen.getByText("Connection passed")).toBeInTheDocument());
    await user.clear(screen.getByLabelText("Model"));
    await user.type(screen.getByLabelText("Model"), "changed-chat");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByText("Connection passed")).toBeInTheDocument();
    expect(connectionMocks.testAIConnection).toHaveBeenCalledTimes(1);
  });

  it("does not change the workspace language before saving a settings language choice", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Open settings" }));
    await user.click(screen.getByRole("button", { name: "简体中文" }));
    await user.click(screen.getByRole("link", { name: "Back to workspace" }));

    expect(screen.getByRole("button", { name: "Translate" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "翻译" })).not.toBeInTheDocument();
  });

  it("applies the selected settings language after saving changes", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Open settings" }));
    await user.click(screen.getByRole("button", { name: "简体中文" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await user.click(screen.getByRole("link", { name: "返回工作区" }));

    expect(screen.getByRole("button", { name: "翻译" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "打开设置" })).toBeInTheDocument();
  });

  it("uses the saved settings language on the next render", async () => {
    const user = userEvent.setup();
    const firstRender = render(<App />);

    await user.click(await screen.findByRole("button", { name: "Open settings" }));
    await user.click(screen.getByRole("button", { name: "简体中文" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    firstRender.unmount();
    window.location.hash = "";
    resetWorkspaceI18nForTests();

    render(<App />);

    expect(await screen.findByRole("button", { name: "翻译" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "打开设置" })).toBeInTheDocument();
  });

  it("applies and persists the selected workspace theme after saving settings", async () => {
    const user = userEvent.setup();
    const firstRender = render(<App />);

    await user.click(await screen.findByRole("button", { name: "Open settings" }));
    await user.click(screen.getByRole("button", { name: "Dark" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(document.documentElement).toHaveClass("dark");

    firstRender.unmount();
    window.location.hash = "#settings";
    resetWorkspaceI18nForTests();

    render(<App />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "true"));
    expect(document.documentElement).toHaveClass("dark");
  });

  it("shows the saved settings language choice when settings is opened again", async () => {
    const user = userEvent.setup();
    const firstRender = render(<App />);

    await user.click(await screen.findByRole("button", { name: "Open settings" }));
    await user.click(screen.getByRole("button", { name: "简体中文" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    firstRender.unmount();
    window.location.hash = "#settings";
    resetWorkspaceI18nForTests();

    render(<App />);

    await waitFor(() => expect(screen.getByRole("button", { name: "简体中文" })).toHaveAttribute("aria-pressed", "true"));
  });

  it("renders the translation workspace controls and panels", async () => {
    const { container } = render(<App />);

    expect(await screen.findByRole("button", { name: "Translate" })).toBeInTheDocument();
    expect(screen.getByRole("banner")).toHaveTextContent("Kotoba");
    expect(screen.getByRole("button", { name: "Translation direction: English to Chinese" })).toBeInTheDocument();
    const historyButton = screen.getByRole("button", { name: "Open translation history" });
    const settingsButton = screen.getByRole("button", { name: "Open settings" });
    expect(historyButton).toBeInTheDocument();
    expect(settingsButton).toBeInTheDocument();
    expect(
      historyButton.compareDocumentPosition(settingsButton) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(await within(screen.getByRole("form", { name: "Translation controls" })).findByRole("combobox", { name: "Translation style prompt" })).toHaveValue("Programming technology");
    expect(container.querySelector("select")).not.toBeInTheDocument();
    expect(getPressedDisplayMode(screen.getByRole("region", { name: "Source" }), "Source display mode")).toHaveTextContent("Markdown");
    expect(getPressedDisplayMode(screen.getByRole("region", { name: "Translation" }), "Translation display mode")).toHaveTextContent("Markdown");
    expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download .zh.md" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Translate" })).toBeDisabled();
    expect(within(screen.getByRole("region", { name: "Source" })).getByText("Paste Markdown or plain text here, or upload a .md or .txt file.")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Translation" })).getByText("Translation output will appear here after you start translating.")).toBeInTheDocument();
  });

  it("renders a Markdown source file dropped onto the source panel", async () => {
    const file = new File(["# Dropped notes\n\nSource from drag and drop."], "notes.md", {
      type: "text/markdown",
    });

    render(<App />);

    const sourcePanel = await screen.findByRole("region", { name: "Source" });
    fireEvent.drop(sourcePanel, {
      dataTransfer: {
        files: [file],
        items: [{ kind: "file", getAsFile: () => file }],
        types: ["Files"],
      },
    });

    expect(await within(sourcePanel).findByRole("heading", { name: "Dropped notes" })).toBeInTheDocument();
    expect(within(sourcePanel).getByText("Source from drag and drop.")).toBeInTheDocument();
  });

  it("shows a page-level file drop overlay and loads the dropped source file", async () => {
    const file = new File(["# Page drop\n\nLoaded from the workspace shell."], "page-drop.md", {
      type: "text/markdown",
    });

    render(<App />);

    await screen.findByRole("button", { name: "Translate" });
    fireEvent.dragEnter(screen.getByRole("main"), {
      dataTransfer: createFileDataTransfer(file),
    });

    expect(screen.getByText("Release to load file")).toBeInTheDocument();
    expect(screen.getByText("The file will replace the current Source input. Markdown and plain text files are supported.")).toBeInTheDocument();

    fireEvent.drop(screen.getByRole("main"), {
      dataTransfer: createFileDataTransfer(file),
    });

    expect(screen.queryByText("Release to load file")).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Page drop" })).toBeInTheDocument();
    expect(screen.getByText("Loaded from the workspace shell.")).toBeInTheDocument();
  });

  it("opens local translation history in a right drawer and restores a record", async () => {
    const user = userEvent.setup();
    const record = createHistoryRecord({
      id: "history-api-migration",
      title: "API migration notes",
      sourceContent: "# API migration notes",
      translatedContent: "# API 迁移说明",
    });
    useWorkspaceStore.getState().prependHistoryRecord(record);

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Open translation history" }));
    const historyDrawer = await screen.findByRole("dialog", { name: "Translation history" });

    expect(within(historyDrawer).getByRole("heading", { name: "History" })).toBeInTheDocument();
    expect(within(historyDrawer).getByText("1 saved record")).toBeInTheDocument();
    expect(within(historyDrawer).getByRole("button", { name: /Restore API migration notes/ })).toBeInTheDocument();

    await user.click(within(historyDrawer).getByRole("button", { name: /Restore API migration notes/ }));

    expect(within(screen.getByRole("region", { name: "Source", hidden: true })).getByRole("heading", { name: "API migration notes", hidden: true })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Translation", hidden: true })).getByRole("heading", { name: "API 迁移说明", hidden: true })).toBeInTheDocument();
  });

  it("loads saved translation history when the workspace is opened again", async () => {
    const user = userEvent.setup();
    const record = createHistoryRecord({
      id: "history-reloaded",
      title: "Reloaded history item",
    });
    await saveTranslationHistoryRecords([record]);
    useWorkspaceStore.getState().resetWorkspaceStateForTests();

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Open translation history" }));
    const historyDrawer = await screen.findByRole("dialog", { name: "Translation history" });

    expect(within(historyDrawer).getByText("1 saved record")).toBeInTheDocument();
    expect(within(historyDrawer).getByRole("button", { name: /Restore Reloaded history item/ })).toBeInTheDocument();
  });

  it("shows an empty state when translation history has no records", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Open translation history" }));
    const historyDrawer = await screen.findByRole("dialog", { name: "Translation history" });

    expect(within(historyDrawer).getByText("No translations saved yet")).toBeInTheDocument();
    expect(within(historyDrawer).getByText("Complete a translation and it will appear here with its model, style, and storage size.")).toBeInTheDocument();
    expect(within(historyDrawer).getByText("Successful translations are saved locally.")).toBeInTheDocument();
  });

  it("does not translate when AI provider settings are missing", async () => {
    const user = userEvent.setup();

    render(<App />);
    await setSourceMarkdown(user, "# Draft translation\n\nSome source text.");

    await user.click(screen.getByRole("button", { name: "Translate" }));

    expect(translationMocks.translateSourceContent).not.toHaveBeenCalled();
    expect(within(screen.getByRole("region", { name: "Translation" })).queryByRole("heading", { name: "发布说明" })).not.toBeInTheDocument();
  });

  it("streams translation output into the translation panel and saves the completed record to history", async () => {
    const user = userEvent.setup();
    await saveAISettings({
      baseUrl: "https://api.example.com/v1",
      apiKey: "sk-real-key",
      model: "example-chat",
    });
    translationMocks.translateSourceContent.mockImplementation(async function* () {
      yield { type: "text", text: "# 示例文档\n\n" };
      yield { type: "text", text: "这是第一段译文。" };
    });

    render(<App />);
    await setSourceMarkdown(user, "# Release notes");

    await user.click(screen.getByRole("button", { name: "Translate" }));

    expect(await within(screen.getByRole("region", { name: "Translation" })).findByRole("heading", { name: "示例文档" })).toBeInTheDocument();
    expect(await within(screen.getByRole("region", { name: "Translation" })).findByText("这是第一段译文。")).toBeInTheDocument();
    expect(translationMocks.translateSourceContent).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceContent: "# Release notes",
        settings: expect.objectContaining({
          baseUrl: "https://api.example.com/v1",
          apiKey: "sk-real-key",
          model: "example-chat",
        }),
      }),
    );
    await user.click(screen.getByRole("button", { name: "Open translation history" }));

    const historyDrawer = await screen.findByRole("dialog", { name: "Translation history" });
    const historyItem = within(historyDrawer).getByRole("button", { name: /Restore Release notes/ });

    expect(historyItem).toHaveTextContent("Release notes");
    expect(historyItem).toHaveTextContent(/Programming technology/);
    expect(historyItem).toHaveTextContent(/example-chat/);
    expect(historyItem).toHaveTextContent(/B|KB|MB/);
  });

  it("uses the selected style prompt when translating", async () => {
    const user = userEvent.setup();
    await saveAISettings({
      baseUrl: "https://api.example.com/v1",
      apiKey: "sk-real-key",
      model: "example-chat",
    });

    render(<App />);
    await setSourceMarkdown(user, "# Release notes");

    const stylePromptCombobox = await within(screen.getByRole("form", { name: "Translation controls" })).findByRole("combobox", { name: "Translation style prompt" });
    await user.click(stylePromptCombobox);
    await user.click(await screen.findByRole("option", { name: "General" }));
    await user.click(screen.getByRole("button", { name: "Translate" }));

    expect(translationMocks.translateSourceContent).toHaveBeenCalledWith(
      expect.objectContaining({
        stylePrompt: "Use clear, natural wording for general reading. Keep the tone neutral and avoid adding details that are not in the source.",
      }),
    );

    await user.click(screen.getByRole("button", { name: "Open translation history" }));
    const historyDrawer = await screen.findByRole("dialog", { name: "Translation history" });
    expect(within(historyDrawer).getByRole("button", { name: /Restore Release notes/ })).toHaveTextContent(/General/);
  });

  it("shows thinking output while translating and removes it after translation completes", async () => {
    const user = userEvent.setup();
    let releaseTranslation: (() => void) | undefined;
    await saveAISettings({
      baseUrl: "https://api.example.com/v1",
      apiKey: "sk-real-key",
      model: "example-chat",
      thinkingEnabled: true,
    });
    translationMocks.translateSourceContent.mockImplementation(async function* () {
      yield { type: "thinking", text: "Checking headings before translating." };
      await new Promise<void>((resolve) => {
        releaseTranslation = resolve;
      });
      yield { type: "text", text: "# 示例文档" };
    });

    render(<App />);
    await setSourceMarkdown(user, "# Release notes");

    await user.click(screen.getByRole("button", { name: "Translate" }));

    expect(await screen.findByText("AI is thinking")).toBeInTheDocument();
    expect(screen.getByText("Checking headings before translating.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Translate" })).toBeDisabled();
    expect(within(screen.getByRole("region", { name: "Source" })).getByRole("button", { name: "Clear" })).toBeDisabled();
    expect(within(screen.getByRole("region", { name: "Translation" })).getByRole("button", { name: "Stop" })).toBeEnabled();

    releaseTranslation?.();

    expect(await within(screen.getByRole("region", { name: "Translation" })).findByRole("heading", { name: "示例文档" })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("AI is thinking")).not.toBeInTheDocument());
  });

  it("keeps stopped partial output out of translation history", async () => {
    const user = userEvent.setup();
    await saveAISettings({
      baseUrl: "https://api.example.com/v1",
      apiKey: "sk-real-key",
      model: "example-chat",
    });
    translationMocks.translateSourceContent.mockImplementation(async function* ({ abortSignal }: { abortSignal: AbortSignal }) {
      yield { type: "text", text: "# 部分译文" };
      await new Promise<void>((resolve) => {
        abortSignal.addEventListener("abort", () => resolve(), { once: true });
      });
    });

    render(<App />);
    await setSourceMarkdown(user, "# Release notes");

    await user.click(screen.getByRole("button", { name: "Translate" }));

    expect(await within(screen.getByRole("region", { name: "Translation" })).findByRole("heading", { name: "部分译文" })).toBeInTheDocument();

    await user.click(within(screen.getByRole("region", { name: "Translation" })).getByRole("button", { name: "Stop" }));

    await waitFor(() => expect(within(screen.getByRole("region", { name: "Translation" })).getByRole("button", { name: "Stop" })).toBeDisabled());
    await expect(getSavedTranslationHistoryRecords()).resolves.toEqual([]);
    expect(within(screen.getByRole("region", { name: "Translation" })).getByRole("heading", { name: "部分译文" })).toBeInTheDocument();
  });

  it("persists the completed translation record for future workspace loads", async () => {
    const user = userEvent.setup();
    await saveAISettings({
      baseUrl: "https://api.example.com/v1",
      apiKey: "sk-real-key",
      model: "example-chat",
    });
    translationMocks.translateSourceContent.mockImplementation(async function* () {
      yield { type: "text", text: "# 持久化译文" };
    });

    render(<App />);
    await setSourceMarkdown(user, "# Release notes");

    await user.click(screen.getByRole("button", { name: "Translate" }));

    await waitFor(async () => {
      await expect(getSavedTranslationHistoryRecords()).resolves.toEqual([
        expect.objectContaining({
          title: "Release notes",
          translatedContent: "# 持久化译文",
        }),
      ]);
    });
  });

  it("deletes a translation history record only after confirmation", async () => {
    const user = userEvent.setup();
    useWorkspaceStore.getState().prependHistoryRecord(createHistoryRecord({ id: "history-delete", title: "Delete me" }));

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Open translation history" }));
    const historyDrawer = await screen.findByRole("dialog", { name: "Translation history" });

    await user.click(within(historyDrawer).getByRole("button", { name: "Delete Delete me" }));

    expect(within(historyDrawer).getByText("Delete me")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Delete record?" })).toBeInTheDocument();
    expect(screen.getByText("This removes Delete me from local history and cannot be restored.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Keep record" }));

    expect(screen.queryByRole("heading", { name: "Delete record?" })).not.toBeInTheDocument();
    expect(within(historyDrawer).getByText("Delete me")).toBeInTheDocument();

    await user.click(within(historyDrawer).getByRole("button", { name: "Delete Delete me" }));
    await user.click(await screen.findByRole("button", { name: "Delete record" }));

    expect(within(historyDrawer).getByText("0 saved records")).toBeInTheDocument();
    expect(within(historyDrawer).queryByText("Delete me")).not.toBeInTheDocument();
  });

  it("switches source and translation panels between rendered Markdown and raw text", async () => {
    const user = userEvent.setup();

    render(<App />);

    const sourcePanel = await screen.findByRole("region", { name: "Source" });
    const translationPanel = screen.getByRole("region", { name: "Translation" });

    expect(within(sourcePanel).getByText("Paste Markdown or plain text here, or upload a .md or .txt file.")).toBeInTheDocument();
    expect(within(sourcePanel).queryByRole("textbox", { name: "Source content" })).not.toBeInTheDocument();
    expect(within(translationPanel).getByText("Translation output will appear here after you start translating.")).toBeInTheDocument();

    await user.click(getDisplayModeButton(sourcePanel, "Source display mode", "Plain text"));
    await user.click(getDisplayModeButton(translationPanel, "Translation display mode", "Plain text"));

    const sourceTextbox = within(sourcePanel).getByRole("textbox", { name: "Source content" });
    expect(sourceTextbox).toHaveAttribute("placeholder", "Paste Markdown or plain text here, or upload a .md or .txt file.");
    expect(within(translationPanel).getByText("Translation output will appear here after you start translating.")).toBeInTheDocument();
  });

  it("edits source content as raw text and previews it as Markdown in a single content area", async () => {
    const user = userEvent.setup();

    render(<App />);

    const sourcePanel = await screen.findByRole("region", { name: "Source" });
    expect(getPressedDisplayMode(sourcePanel, "Source display mode")).toHaveTextContent("Markdown");
    expect(within(sourcePanel).queryByRole("textbox", { name: "Source content" })).not.toBeInTheDocument();

    await user.click(getDisplayModeButton(sourcePanel, "Source display mode", "Plain text"));
    const sourceTextbox = within(sourcePanel).getByRole("textbox", { name: "Source content" });
    await user.clear(sourceTextbox);
    await user.type(sourceTextbox, "# Draft title");

    expect(sourceTextbox).toHaveValue("# Draft title");
    expect(within(sourcePanel).queryByRole("heading", { name: "Draft title" })).not.toBeInTheDocument();

    await user.click(getDisplayModeButton(sourcePanel, "Source display mode", "Markdown"));

    expect(within(sourcePanel).queryByRole("textbox", { name: "Source content" })).not.toBeInTheDocument();
    expect(within(sourcePanel).getByRole("heading", { name: "Draft title" })).toBeInTheDocument();
  });

  it("renders content as Markdown when Markdown display mode is selected", async () => {
    render(
      <ContentViewer
        content={"# This is a plain text line\n- This is not a list item"}
        contentFormat="Plain text"
        viewFormat="Markdown"
      />,
    );

    expect(screen.getByRole("heading", { name: "This is a plain text line" })).toBeInTheDocument();
    expect(screen.getByRole("list")).toHaveTextContent("This is not a list item");
  });

  it("switches the translation direction from a single control", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Translation direction: English to Chinese" }));

    expect(screen.getByRole("button", { name: "Translation direction: Chinese to English" })).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Source language" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Target language" })).not.toBeInTheDocument();
  });
});

function getDisplayModeButton(panel: HTMLElement, groupName: string, optionName: string) {
  return within(within(panel).getByRole("group", { name: groupName })).getByRole("button", { name: optionName });
}

function getPressedDisplayMode(panel: HTMLElement, groupName: string) {
  return within(within(panel).getByRole("group", { name: groupName })).getByRole("button", { pressed: true });
}

function renderAppWithToaster() {
  return render(
    <>
      <App />
      <Toaster />
    </>,
  );
}

async function setSourceMarkdown(user: ReturnType<typeof userEvent.setup>, content: string) {
  const sourcePanel = await screen.findByRole("region", { name: "Source" });

  await user.click(getDisplayModeButton(sourcePanel, "Source display mode", "Plain text"));
  await user.clear(within(sourcePanel).getByRole("textbox", { name: "Source content" }));
  await user.type(within(sourcePanel).getByRole("textbox", { name: "Source content" }), content);
}

function createFileDataTransfer(file: File) {
  return {
    files: [file],
    items: [{ kind: "file", getAsFile: () => file }],
    types: ["Files"],
    dropEffect: "none",
  };
}

function createHistoryRecord(overrides: Partial<TranslationHistoryRecord> = {}): TranslationHistoryRecord {
  return {
    id: "history-test-record",
    title: "History item",
    sourceContent: "# History item",
    translatedContent: "# 历史项",
    sourceContentFormat: "Markdown",
    translationContentFormat: "Markdown",
    translationDirection: "en-zh",
    stylePromptName: "Programming technology",
    baseUrl: "https://api.example.com/v1",
    model: "example-chat",
    createdAt: "2026-06-23T07:12:00.000Z",
    ...overrides,
  };
}

function setBrowserLanguage(language: string) {
  Object.defineProperty(window.navigator, "language", {
    value: language,
    configurable: true,
  });
}
