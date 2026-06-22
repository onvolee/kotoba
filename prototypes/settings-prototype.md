# Kotoba Settings Prototype

本文档记录当前确认的设置页形态，只描述整体布局、区域关系和按钮摆放。视觉主题、颜色、字体、间距、图标、动效、组件库等 UI 实现细节暂不在本文档中定义。

## 页面定位

Kotoba 的设置页是浏览器扩展工作台内的独立页面，用于管理翻译工作台运行所需的本地配置。

页面核心任务：

- 配置 OpenAI-compatible provider 的 Base URL、API Key 和 Model。
- 保存 API 设置到本地扩展存储。
- 使用当前 API 设置发起连接测试。
- 查看本地历史记录的存储估算。
- 配置界面语言和主题。

## 整体布局

页面采用顶部工具栏 + 左侧设置目录 + 右侧单模块内容区的结构。

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Header                                                              │
│ Brand                         Settings title          Back workspace │
├───────────────────────┬─────────────────────────────────────────────┤
│ Settings menu          │ Active settings module                      │
│                       │                                             │
│ AI settings            │ Module header                               │
│ Local data             │ Module content                              │
│ Performance            │ Form / status / actions                     │
│                       │                                             │
└───────────────────────┴─────────────────────────────────────────────┘

Clicking a settings menu item replaces the right-side module content.
```

## Header

Header 分为左、中、右三组。

### 左侧

显示产品标识和一句简短说明。

```text
Kotoba    Markdown and text translation workspace
```

### 中间

显示当前页面定位。

```text
Settings · Local extension configuration
```

### 右侧

放置返回工作台按钮。

```text
[Workspace]
```

要求：

- `Workspace` 返回主翻译工作台页面。
- Header 不放具体设置项。

## Settings Menu

左侧设置目录用于切换右侧模块内容。

```text
┌────────────────────────────┐
│ Settings                   │
│ AI settings                │
│ Local data                 │
│ Performance                │
└────────────────────────────┘
```

要求：

- 目录只包含一级菜单。
- 默认打开 `AI settings`。
- 当前菜单项需要有 active 状态。
- 点击菜单项后，右侧只显示对应模块内容，不在同一页面纵向堆叠所有模块。

## AI Settings Module

`AI settings` 用于配置模型供应商和测试连接。

```text
┌────────────────────────────────────────────┐
│ AI settings                  connection status │
│ Description                                  │
├────────────────────────────────────────────┤
│ Provider request                            │
│ Base URL                                    │
│ API Key                         Show / Hide │
│ Model                                       │
├────────────────────────────────────────────┤
│ Connection test                             │
│ Last result                         status  │
│ Error handling                      status  │
│                                  Test Save  │
└────────────────────────────────────────────┘
```

### 顶部

显示模块标题、简短说明和连接状态。

示例：

```text
AI settings                  Connection passed
Configure the OpenAI-compatible provider used by direct requests from the extension workspace.
```

### Provider request

配置发起翻译和连接测试所需的 API 设置。

字段：

- `Base URL`
- `API Key`
- `Model`

要求：

- `Base URL` 允许用户输入 OpenAI-compatible provider 地址。
- `API Key` 默认隐藏。
- `API Key` 旁提供 `Show / Hide` 控制，用于切换密钥可见性。
- `Model` 用于填写模型名称。
- API 设置保存在本地扩展存储。
- API Key 不进入历史记录。

### Connection test

用于使用当前 API 设置测试 provider 是否可用。

显示内容：

- 最近一次测试结果。
- 错误处理状态或说明。

操作按钮：

```text
[Test connection]  [Save changes]
```

要求：

- `Test connection` 使用当前表单值发起连接测试。
- `Save changes` 保存当前 API 设置。
- 测试结果应显示成功或失败状态。
- 失败时显示简短可理解的错误信息，不显示 API Key 或 Authorization header。

## Local Data Module

`Local data` 用于显示本地历史记录的存储估算。

```text
┌────────────────────────────────────────────┐
│ Local data                  history status  │
├────────────────────────────────────────────┤
│ Storage estimate                           │
│ ┌────────────┐ ┌────────────┐ ┌──────────┐ │
│ │ 18.4 MB    │ │ 42         │ │ 0        │ │
│ │ history    │ │ records    │ │ keys     │ │
│ └────────────┘ └────────────┘ └──────────┘ │
│ Storage usage meter                         │
└────────────────────────────────────────────┘
```

### 顶部

显示模块标题和历史存储状态。

示例：

```text
Local data                  History stored locally
```

### Storage estimate

显示本地历史记录的存储概况。

指标：

- 历史记录存储估算，例如 `18.4 MB`。
- 已保存的成功翻译数量，例如 `42`。
- 历史记录中的 API Key 数量，例如 `0`。

要求：

- 只显示存储估算，不提供批量删除、清空历史或自动清理入口。
- API Key 数量必须明确显示为不会进入历史记录。
- 可以显示存储使用进度条或估算条。

## Performance Module

`Performance` 用于配置界面语言和主题。

```text
┌────────────────────────────────────────────┐
│ Performance                                │
├────────────────────────────────────────────┤
│ Display                                    │
│ UI language                                │
│ Theme                                      │
│                                  Save      │
└────────────────────────────────────────────┘
```

### 顶部

显示模块标题。

示例：

```text
Performance
```

顶部不显示翻译运行状态、流式状态或性能诊断信息。

### Display

配置界面显示相关偏好。

字段：

- `UI language`
- `Theme`

`UI language` 选项：

- `Follow browser language`
- `English`
- `简体中文`

`Theme` 选项：

- `Light`
- `Dark`

操作按钮：

```text
[Save changes]
```

要求：

- `UI language` 只影响 Kotoba 界面控件，不改写用户输入或翻译输出。
- `Theme` 只提供 `Light` 和 `Dark` 两种选择。
- `Save changes` 保存当前显示偏好。

## Module Switching

设置页右侧内容区每次只显示一个模块。

行为要求：

- 默认显示 `AI settings`。
- 点击 `AI settings` 显示 API 设置和连接测试。
- 点击 `Local data` 显示本地历史存储估算。
- 点击 `Performance` 显示界面语言和主题设置。
- 切换模块不应清空用户已经输入但未保存的表单内容。

## Save Behavior

设置页包含多个保存入口。

要求：

- `AI settings` 的 `Save changes` 保存 API 设置。
- `Performance` 的 `Save changes` 保存显示偏好。
- 保存成功后显示简短状态反馈。
- 保存失败时显示简短错误信息。
- 错误信息不得包含 API Key、Authorization header 或 credential-bearing URL。

