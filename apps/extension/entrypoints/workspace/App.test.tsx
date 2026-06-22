import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { fakeBrowser } from "wxt/testing";
import App from "./App";
import { resetWorkspaceI18nForTests } from "./i18n";
import { ContentViewer } from "./pages/WorkspacePage";

describe("workspace shell", () => {
  beforeEach(() => {
    window.location.hash = "";
    fakeBrowser.reset();
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
    expect(within(screen.getByRole("form", { name: "翻译控制" })).getByRole("combobox", { name: "翻译风格" })).toHaveValue("忠实");
    expect(within(screen.getByRole("region", { name: "原文" })).getByRole("group", { name: "原文显示模式" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "译文" })).getByRole("group", { name: "译文显示模式" })).toBeInTheDocument();
    expect(screen.getByText("输入：Markdown")).toBeInTheDocument();
    expect(screen.getByText("成功翻译会保存在本地")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "上传" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "清空" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "停止" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下载 .zh.md" })).toBeInTheDocument();
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
    expect(screen.getByRole("button", { name: "Open settings" })).toBeInTheDocument();
    expect(within(screen.getByRole("form", { name: "Translation controls" })).getByRole("combobox", { name: "Style preset" })).toHaveValue("Faithful");
    expect(container.querySelector("select")).not.toBeInTheDocument();
    expect(getPressedDisplayMode(screen.getByRole("region", { name: "Source" }), "Source display mode")).toHaveTextContent("Markdown");
    expect(getPressedDisplayMode(screen.getByRole("region", { name: "Translation" }), "Translation display mode")).toHaveTextContent("Markdown");
    expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download .zh.md" })).toBeInTheDocument();
  });

  it("switches source and translation panels between rendered Markdown and raw text", async () => {
    const user = userEvent.setup();

    render(<App />);

    const sourcePanel = await screen.findByRole("region", { name: "Source" });
    const translationPanel = screen.getByRole("region", { name: "Translation" });

    expect(within(sourcePanel).getByRole("heading", { name: "Release notes" })).toBeInTheDocument();
    expect(within(sourcePanel).getByRole("list")).toHaveTextContent("Preserve lists and headings");
    expect(within(sourcePanel).queryByRole("textbox", { name: "Source content" })).not.toBeInTheDocument();
    expect(within(translationPanel).getByRole("heading", { name: "发布说明" })).toBeInTheDocument();
    expect(within(translationPanel).getByRole("list")).toHaveTextContent("保留列表和标题");

    await user.click(getDisplayModeButton(sourcePanel, "Source display mode", "Plain text"));
    await user.click(getDisplayModeButton(translationPanel, "Translation display mode", "Plain text"));

    const sourceTextbox = within(sourcePanel).getByRole("textbox", { name: "Source content" });
    expect((sourceTextbox as HTMLTextAreaElement).value).toContain("# Release notes");
    expect((sourceTextbox as HTMLTextAreaElement).value).toContain("- Preserve lists and headings");
    expect(within(translationPanel).getByText(/^# 发布说明/)).toBeInTheDocument();
    expect(within(translationPanel).getByText(/- 保留列表和标题/)).toBeInTheDocument();
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

function setBrowserLanguage(language: string) {
  Object.defineProperty(window.navigator, "language", {
    value: language,
    configurable: true,
  });
}
