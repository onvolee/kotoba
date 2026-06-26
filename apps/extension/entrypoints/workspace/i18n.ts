import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { storage } from "wxt/utils/storage";

import { programmingTechnologyPrompt } from "./style-prompts";

export type UiLanguage = "en" | "zh-CN";
export type UiLanguagePreference = "browser" | UiLanguage;

const uiLanguagePreferenceKey = "local:ui-language-preference";

const resources = {
  en: {
    translation: {
      common: {
        actions: {
          cancel: "Cancel",
          clear: "Clear",
          copy: "Copy",
          download: "Download",
          saveChanges: "Save changes",
          stop: "Stop",
          upload: "Upload",
        },
        formats: {
          markdown: "Markdown",
          plainText: "Plain text",
        },
      },
      workspace: {
        controls: {
          label: "Translation controls",
        },
        direction: {
          ariaLabel: "Translation direction: {{source}} to {{target}}",
          chinese: "Chinese",
          english: "English",
        },
        fileDrop: {
          description: "The file will replace the current Source input. Markdown and plain text files are supported.",
          meta: ".md · .markdown · .txt",
          title: "Release to load file",
        },
        history: {
          ariaLabel: "Translation history",
          cancelDelete: "Keep record",
          close: "Close translation history",
          deleteConfirm: "Delete this translation history record?",
          deleteConfirmDescription: "This removes {{title}} from local history and cannot be restored.",
          deleteConfirmTitle: "Delete record?",
          deleteRecord: "Delete {{title}}",
          confirmDelete: "Delete record",
          emptyDescription: "Complete a translation and it will appear here with its model, style, and storage size.",
          emptyHint: "Successful translations are saved locally.",
          emptyTitle: "No translations saved yet",
          recordCount_one: "{{count}} saved record",
          recordCount_other: "{{count}} saved records",
          restore: "Restore",
          restoreRecord: "Restore {{title}}",
          title: "History",
        },
        openHistory: "Open translation history",
        openSettings: "Open settings",
        missingProviderSettings: "Configure AI provider settings before translating.",
        panels: {
          source: {
            contentLabel: "Source content",
            copiedToast: "Source copied",
            description: "Drag a .md or .txt file onto the editor, upload from the bottom bar, or paste directly.",
            formatLabel: "Source display mode",
            footerStatus: "Input: {{format}}",
            placeholder: "Paste Markdown or plain text here, or upload a .md or .txt file.",
            title: "Source",
            uploadedToast: "Source file loaded",
          },
          translation: {
            copiedToast: "Translation copied",
            downloadFilename: "Download .zh.md",
            errorDescription: "Check the AI provider Base URL, API key, and model, then try again.",
            formatLabel: "Translation display mode",
            footerStatus: "Successful translations will be saved locally",
            meta: "Ready · {{style}} · {{model}}",
            noModel: "No model configured",
            placeholder: "Translation output will appear here after you start translating.",
            requestFailedToast: "Translation failed",
            thinkingTitle: "AI is thinking",
            title: "Translation",
          },
        },
        stylePrompts: {
          label: "Translation style prompt",
          none: "No style prompt",
        },
        subtitle: "Markdown and text translation workspace",
        translate: "Translate",
      },
      settings: {
        activeModule: "Active settings module",
        ai: {
          apiKeyDescription: "API Key is not stored in translation history.",
          apiKeyLabel: "API Key",
          baseUrlDescription: "OpenAI-compatible provider endpoint.",
          baseUrlLabel: "Base URL",
          connectionTest: "Connection test",
          connectionTestDescription: "Send a tiny request with the current provider settings.",
          connectionResults: {
            failed: "Connection failed",
            "not-tested": "Not tested",
            passed: "Connection passed",
            testing: "Testing",
          },
          description: "Configure the OpenAI-compatible provider used by direct requests from the extension workspace.",
          errorHandling: "Error handling",
          hideApiKey: "Hide API key",
          lastResult: "Last result",
          modelDescription: "Model name used by the provider.",
          modelLabel: "Model",
          noError: "No error",
          notTested: "Not tested",
          providerRequest: "Provider request",
          providerRequestDescription: "These values are used for translation and connection tests.",
          showApiKey: "Show API key",
          status: "Connection not tested",
          testConnection: "Test connection",
          thinkingModeDescription: "Turn model thinking on or off. When enabled, reasoning models can think before answering and the thinking process appears while translation is running.",
          thinkingModeLabel: "Thinking mode",
          title: "AI settings",
        },
        backToWorkspace: "Back to workspace",
        display: "Display",
        localConfiguration: "Local extension configuration",
        localData: {
          apiKeysInHistory: "API keys in history",
          description: "Estimate local translation history storage. API keys are not stored in history.",
          estimateOnly: "Estimate only",
          historyStorage: "history storage",
          savedRecords: "saved records",
          status: "History stored locally",
          storageEstimate: "Storage estimate",
          storageUsageMeter: "Storage usage meter",
          title: "Local data",
        },
        menu: "Settings menu",
        modules: {
          aiDescription: "Provider request and connection test",
          localDataDescription: "History storage estimate",
          navigation: "Settings modules",
          performanceDescription: "Language and theme",
          stylePromptsDescription: "AI tone instructions",
        },
        performance: {
          description: "Configure display preferences for the workspace interface.",
          title: "General",
        },
        preferences: {
          browser: "Browser",
          dark: "Dark",
          followBrowserLanguage: "Follow browser language",
          light: "Light",
          system: "System",
          themeDescription: "Display theme for the extension workspace.",
          themeLabel: "Theme",
          uiLanguageDescription: "Only changes Kotoba controls, not source content or translation output.",
          uiLanguageLabel: "UI language",
        },
        saveChanges: "Save changes",
        savedToast: "Settings saved",
        stylePrompts: {
          addAction: "Add style prompt",
          addDescription: "Create a reusable prompt that describes how AI should shape wording and tone.",
          addSection: "New style prompt",
          builtInBadge: "Built-in",
          builtIns: {
            "built-in-general": {
              name: "General",
              prompt: "Use clear, natural wording for general reading. Keep the tone neutral and avoid adding details that are not in the source.",
            },
            "built-in-programming-technology": {
              name: "Programming technology",
              prompt: programmingTechnologyPrompt,
            },
          },
          customBadge: "Custom",
          confirmSaveAction: "Confirm save",
          deleteAction: "Delete {{name}}",
          description: "Manage reusable AI style prompts for translation tone and wording.",
          editAction: "Edit {{name}}",
          editDrawerDescription: "Use the larger editor to refine longer instructions without crowding the prompt list.",
          editDrawerTitle: "Edit style prompt",
          editNameLabel: "Edit style name",
          editPromptLabel: "Edit prompt",
          nameDescription: "Use a short name that is easy to recognize in a list.",
          nameLabel: "Style name",
          promptDescription: "Write the instruction the AI should follow for this style.",
          promptLabel: "Prompt",
          saveAction: "Save style prompt",
          saveConfirmDescription: "Save this custom style prompt?",
          title: "Style prompts",
          viewDrawerDescription: "Review this built-in prompt. Built-in prompts cannot be edited.",
        },
        title: "Settings",
        workspace: "Workspace",
      },
    },
  },
  "zh-CN": {
    translation: {
      common: {
        actions: {
          cancel: "取消",
          clear: "清空",
          copy: "复制",
          download: "下载",
          saveChanges: "保存更改",
          stop: "停止",
          upload: "上传",
        },
        formats: {
          markdown: "Markdown",
          plainText: "纯文本",
        },
      },
      workspace: {
        controls: {
          label: "翻译控制",
        },
        direction: {
          ariaLabel: "翻译方向：{{source}}到{{target}}",
          chinese: "中文",
          english: "英语",
        },
        fileDrop: {
          description: "内容会放进原文面板，当前输入将被替换。支持 Markdown 和纯文本。",
          meta: ".md · .markdown · .txt",
          title: "松手后读取文件",
        },
        history: {
          ariaLabel: "翻译历史",
          cancelDelete: "保留记录",
          close: "关闭翻译历史",
          deleteConfirm: "删除这条翻译历史记录？",
          deleteConfirmDescription: "这会从本地历史中删除“{{title}}”，删除后无法恢复。",
          deleteConfirmTitle: "删除记录？",
          deleteRecord: "删除 {{title}}",
          confirmDelete: "删除记录",
          emptyDescription: "完成一次翻译后，它会带着模型、风格和占用大小显示在这里。",
          emptyHint: "成功翻译会保存在本地。",
          emptyTitle: "还没有保存翻译",
          recordCount_one: "{{count}} 条已保存记录",
          recordCount_other: "{{count}} 条已保存记录",
          restore: "恢复",
          restoreRecord: "恢复 {{title}}",
          title: "历史",
        },
        openHistory: "打开翻译历史",
        openSettings: "打开设置",
        missingProviderSettings: "请先配置 AI 服务设置再翻译。",
        panels: {
          source: {
            contentLabel: "原文内容",
            copiedToast: "原文已复制",
            description: "将 .md 或 .txt 文件拖到编辑器，或从底部上传，也可以直接粘贴。",
            formatLabel: "原文显示模式",
            footerStatus: "输入：{{format}}",
            placeholder: "在这里粘贴 Markdown 或纯文本，也可以上传 .md 或 .txt 文件。",
            title: "原文",
            uploadedToast: "已载入原文文件",
          },
          translation: {
            copiedToast: "译文已复制",
            downloadFilename: "下载 .zh.md",
            errorDescription: "请检查 AI 服务的 Base URL、API Key 和模型名称，然后重试。",
            formatLabel: "译文显示模式",
            footerStatus: "成功翻译会保存在本地",
            meta: "就绪 · {{style}} · {{model}}",
            noModel: "未配置模型",
            placeholder: "开始翻译后，译文会显示在这里。",
            requestFailedToast: "翻译失败",
            thinkingTitle: "AI 正在思考",
            title: "译文",
          },
        },
        stylePrompts: {
          label: "翻译提示词风格",
          none: "未选择提示词",
        },
        subtitle: "Markdown 与文本翻译工作区",
        translate: "翻译",
      },
      settings: {
        activeModule: "当前设置模块",
        ai: {
          apiKeyDescription: "API Key 不会存入翻译历史。",
          apiKeyLabel: "API Key",
          baseUrlDescription: "OpenAI 兼容服务端点。",
          baseUrlLabel: "Base URL",
          connectionTest: "连接测试",
          connectionTestDescription: "使用当前服务设置发送一个小请求。",
          connectionResults: {
            failed: "连接失败",
            "not-tested": "未测试",
            passed: "连接通过",
            testing: "测试中",
          },
          description: "配置扩展工作区直接请求使用的 OpenAI 兼容服务。",
          errorHandling: "错误处理",
          hideApiKey: "隐藏 API key",
          lastResult: "上次结果",
          modelDescription: "服务商使用的模型名称。",
          modelLabel: "模型",
          noError: "无错误",
          notTested: "未测试",
          providerRequest: "服务请求",
          providerRequestDescription: "这些值会用于翻译和连接测试。",
          showApiKey: "显示 API key",
          status: "连接未测试",
          testConnection: "测试连接",
          thinkingModeDescription: "开启或关闭模型 Thinking 模式。开启后，推理模型可以先思考再回答，翻译进行时右侧面板会显示思考过程。",
          thinkingModeLabel: "Thinking 模式",
          title: "AI 设置",
        },
        backToWorkspace: "返回工作区",
        display: "显示",
        localConfiguration: "本地扩展配置",
        localData: {
          apiKeysInHistory: "历史中的 API key",
          description: "估算本地翻译历史占用。API key 不会存入历史。",
          estimateOnly: "仅估算",
          historyStorage: "历史存储",
          savedRecords: "已保存记录",
          status: "历史保存在本地",
          storageEstimate: "存储估算",
          storageUsageMeter: "存储用量",
          title: "本地数据",
        },
        menu: "设置菜单",
        modules: {
          aiDescription: "服务请求与连接测试",
          localDataDescription: "历史存储估算",
          navigation: "设置模块",
          performanceDescription: "语言与主题",
          stylePromptsDescription: "AI 语气指令",
        },
        performance: {
          description: "配置工作区界面的显示偏好。",
          title: "通用",
        },
        preferences: {
          browser: "浏览器",
          dark: "深色",
          followBrowserLanguage: "跟随浏览器语言",
          light: "浅色",
          system: "跟随系统",
          themeDescription: "扩展工作区的显示主题。",
          themeLabel: "主题",
          uiLanguageDescription: "只改变 Kotoba 控件，不改变原文内容或译文输出。",
          uiLanguageLabel: "界面语言",
        },
        saveChanges: "保存更改",
        savedToast: "设置已保存",
        stylePrompts: {
          addAction: "添加风格提示词",
          addDescription: "创建一条可复用提示词，用来描述 AI 应该如何处理措辞和语气。",
          addSection: "新风格提示词",
          builtInBadge: "内置",
          builtIns: {
            "built-in-general": {
              name: "通用",
              prompt: "使用清晰自然、适合普通阅读的表达。保持中性语气，不补充原文没有的信息。",
            },
            "built-in-programming-technology": {
              name: "编程技术",
              prompt: programmingTechnologyPrompt,
            },
          },
          customBadge: "自定义",
          confirmSaveAction: "确认保存",
          deleteAction: "删除 {{name}}",
          description: "管理用于控制翻译语气和措辞的 AI 风格提示词。",
          editAction: "编辑 {{name}}",
          editDrawerDescription: "在更大的编辑区里调整较长指令，避免挤占提示词列表。",
          editDrawerTitle: "编辑风格提示词",
          editNameLabel: "编辑风格名称",
          editPromptLabel: "编辑提示词",
          nameDescription: "使用一个在列表中容易识别的短名称。",
          nameLabel: "风格名称",
          promptDescription: "写下 AI 在这个风格下需要遵循的指令。",
          promptLabel: "提示词",
          saveAction: "保存风格提示词",
          saveConfirmDescription: "保存这个自定义风格提示词？",
          title: "风格提示词",
          viewDrawerDescription: "查看这条内置提示词。内置提示词不能编辑。",
        },
        title: "设置",
        workspace: "工作区",
      },
    },
  },
} as const;

export async function initWorkspaceI18n() {
  if (i18n.isInitialized) {
    syncWorkspaceI18nResources();
    return i18n;
  }

  const preference = await getSavedUiLanguagePreference();
  const language = resolveUiLanguagePreference(preference);

  await i18n.use(initReactI18next).init({
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    lng: language,
    resources,
  });
  await i18n.changeLanguage(language);

  return i18n;
}

function syncWorkspaceI18nResources() {
  for (const [language, resource] of Object.entries(resources)) {
    i18n.addResourceBundle(language, "translation", resource.translation, true, true);
  }
}

export async function applyUiLanguagePreference(preference: UiLanguagePreference) {
  await saveUiLanguagePreference(preference);
  return i18n.changeLanguage(resolveUiLanguagePreference(preference));
}

export async function getSavedUiLanguagePreference(): Promise<UiLanguagePreference> {
  const value = await storage.getItem<UiLanguagePreference>(uiLanguagePreferenceKey, {
    fallback: "browser",
  });

  return isUiLanguagePreference(value) ? value : "browser";
}

async function saveUiLanguagePreference(preference: UiLanguagePreference) {
  await storage.setItem(uiLanguagePreferenceKey, preference);
}

export function resetWorkspaceI18nForTests() {
  i18n.isInitialized = false;
}

function resolveUiLanguagePreference(preference: UiLanguagePreference): UiLanguage {
  if (preference === "browser") {
    return resolveBrowserUiLanguage();
  }

  return preference;
}

function isUiLanguagePreference(value: unknown): value is UiLanguagePreference {
  return value === "browser" || value === "en" || value === "zh-CN";
}

function resolveBrowserUiLanguage(): UiLanguage {
  const language = navigator.language.toLowerCase();

  if (language === "zh" || language.startsWith("zh-cn") || language.startsWith("zh-hans")) {
    return "zh-CN";
  }

  return "en";
}
