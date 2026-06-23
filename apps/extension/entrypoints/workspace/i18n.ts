import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { storage } from "wxt/utils/storage";

export type UiLanguage = "en" | "zh-CN";
export type UiLanguagePreference = "browser" | UiLanguage;

const uiLanguagePreferenceKey = "local:ui-language-preference";

const resources = {
  en: {
    translation: {
      common: {
        actions: {
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
            description: "Drag a .md or .txt file onto the editor, upload from the bottom bar, or paste directly.",
            formatLabel: "Source display mode",
            footerStatus: "Input: {{format}}",
            title: "Source",
          },
          translation: {
            copiedToast: "Translation copied",
            downloadFilename: "Download .zh.md",
            formatLabel: "Translation display mode",
            footerStatus: "Successful translations will be saved locally",
            meta: "Ready · {{style}} · {{model}}",
            noModel: "No model configured",
            title: "Translation",
          },
        },
        stylePresets: {
          faithful: "Faithful",
          label: "Style preset",
          natural: "Natural",
          polished: "Polished",
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
        },
        performance: {
          description: "Configure display preferences for the workspace interface.",
          title: "Performance",
        },
        preferences: {
          browser: "Browser",
          dark: "Dark",
          followBrowserLanguage: "Follow browser language",
          light: "Light",
          themeDescription: "Display theme for the extension workspace.",
          themeLabel: "Theme",
          uiLanguageDescription: "Only changes Kotoba controls, not source content or translation output.",
          uiLanguageLabel: "UI language",
        },
        saveChanges: "Save changes",
        title: "Settings",
        workspace: "Workspace",
      },
    },
  },
  "zh-CN": {
    translation: {
      common: {
        actions: {
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
            description: "将 .md 或 .txt 文件拖到编辑器，或从底部上传，也可以直接粘贴。",
            formatLabel: "原文显示模式",
            footerStatus: "输入：{{format}}",
            title: "原文",
          },
          translation: {
            copiedToast: "译文已复制",
            downloadFilename: "下载 .zh.md",
            formatLabel: "译文显示模式",
            footerStatus: "成功翻译会保存在本地",
            meta: "就绪 · {{style}} · {{model}}",
            noModel: "未配置模型",
            title: "译文",
          },
        },
        stylePresets: {
          faithful: "忠实",
          label: "翻译风格",
          natural: "自然",
          polished: "润色",
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
        },
        performance: {
          description: "配置工作区界面的显示偏好。",
          title: "性能",
        },
        preferences: {
          browser: "浏览器",
          dark: "深色",
          followBrowserLanguage: "跟随浏览器语言",
          light: "浅色",
          themeDescription: "扩展工作区的显示主题。",
          themeLabel: "主题",
          uiLanguageDescription: "只改变 Kotoba 控件，不改变原文内容或译文输出。",
          uiLanguageLabel: "界面语言",
        },
        saveChanges: "保存更改",
        title: "设置",
        workspace: "工作区",
      },
    },
  },
} as const;

export async function initWorkspaceI18n() {
  if (i18n.isInitialized) {
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
