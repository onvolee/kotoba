# Kotoba Workspace Prototype

本文档记录当前确认的页面形态，只描述整体布局、区域关系和按钮摆放。视觉主题、颜色、字体、间距、图标、动效等 UI 实现细节暂不在本文档中定义。

## 页面定位

Kotoba 的主界面是一个由浏览器扩展打开的完整工作台页面，不是 popup、side panel 或 new tab override。

页面核心任务：

- 输入 Markdown 或 plain text 内容。
- 配置翻译方向、翻译风格和输入类型。
- 发起流式翻译。
- 查看、复制、下载翻译结果。
- 从历史记录中查看或恢复已成功完成的翻译。

## 整体布局

页面采用顶部工具栏 + 左右双面板 + 右侧历史抽屉的结构。

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Header                                                              │
│ Brand        Translation direction + Translate       Style / History │
├───────────────────────────────────┬─────────────────────────────────┤
│ Source panel                      │ Translation panel               │
│                                   │                                 │
│ Input hint                        │ Output content                  │
│ Source editor / file drop target  │ Streaming translation result    │
│                                   │                                 │
│ Bottom actions                    │ Bottom actions                  │
└───────────────────────────────────┴─────────────────────────────────┘

History button opens a right-side drawer over the workspace.
```

## Header

Header 分为左、中、右三组。

### 左侧

显示产品标识和一句简短说明。

```text
Kotoba    Markdown and text translation workspace
```

### 中间

放置翻译方向和主操作按钮。

```text
[Source language]  ->  [Target language]    [Translate]
```

要求：

- 默认方向为 `English -> 简体中文`。
- 可切换为 `中文 -> English`。
- `Translate` 按钮放在翻译方向控件右侧。
- 不需要单独的 `Swap` 按钮。

### 右侧

放置次级全局控件。

```text
[Style preset]  [Input type]  [History]  [Settings]
```

要求：

- `Style preset` 用于切换翻译风格。
- `Input type` 用于在 `Markdown` 和 `Plain text` 之间切换。
- `History` 打开右侧历史抽屉。
- `Settings` 进入独立的模型/API 设置页面。

## Source Panel

左侧面板用于输入待翻译内容。

```text
┌──────────────────────────────────────┐
│ Source                  filename/meta │
├──────────────────────────────────────┤
│ Input hint                            │
├──────────────────────────────────────┤
│                                      │
│ Source editor                         │
│ Drag file target                      │
│                                      │
├──────────────────────────────────────┤
│ Input status      Upload Copy Download Clear │
└──────────────────────────────────────┘
```

### 顶部

顶部只显示面板标题和当前输入元信息。

示例：

```text
Source                         README.md · 3.8 KB
```

顶部不放 `Upload`、`Copy`、`Download` 等操作按钮。

### 输入提示

输入提示放在编辑器上方，作为一条说明区域。

内容表达：

```text
Drag a .md or .txt file onto the editor, upload from the bottom bar, or paste directly.
```

### 编辑器区域

编辑器本身同时承担粘贴输入和文件拖拽目标。

要求：

- 用户可以直接把 `.md` 或 `.txt` 文件拖到编辑器区域。
- 如果编辑器已有内容，拖拽时提示用户 dropped file 会覆盖当前内容。
- 如果编辑器为空，拖拽时提示 dropped file 会成为当前输入。

### 底部操作区

左侧面板底部放输入相关操作按钮。

```text
Input status                         [Upload] [Copy] [Download] [Clear]
```

按钮位置：

- `Upload`、`Copy`、`Download`、`Clear` 放在底部右侧。
- 底部左侧显示输入状态，例如 `Input: Markdown`。

## Translation Panel

右侧面板用于展示流式翻译结果。

```text
┌────────────────────────────────────────────┐
│ Translation             streaming/meta      │
├────────────────────────────────────────────┤
│                                            │
│ Streaming translation output                │
│                                            │
├────────────────────────────────────────────┤
│ Save/status               Stop Copy Download │
└────────────────────────────────────────────┘
```

### 顶部

顶部只显示面板标题和翻译元信息。

示例：

```text
Translation                  Streaming · Faithful · deepseek-chat
```

顶部不放 `Copy`、`Download` 等操作按钮。

### 内容区

内容区展示流式翻译结果。

要求：

- 翻译结果随着模型输出逐步显示。
- Markdown 或 plain text 格式尽量保持。
- 中止、失败或未完成结果不保存到历史。

### 底部操作区

右侧面板底部放翻译结果相关操作按钮。

```text
Save/status                         [Stop] [Copy] [Download .zh.md]
```

按钮位置：

- `Stop`、`Copy`、`Download` 放在底部右侧。
- 底部左侧显示保存状态，例如成功完成后会保存到本地历史。
- 下载按钮根据翻译方向显示目标文件后缀：
  - `English -> 简体中文`: `.zh.md` 或 `.zh.txt`
  - `中文 -> English`: `.en.md` 或 `.en.txt`

## History Drawer

历史记录不常驻主界面。用户点击 Header 右侧的 `History` 后，从页面右侧展开历史抽屉。

```text
┌──────────────────────────────┐
│ History              Close   │
│ Local history summary         │
├──────────────────────────────┤
│ Storage / count summary       │
├──────────────────────────────┤
│ Today                         │
│ ┌──────────────────────────┐ │
│ │ filename                  │ │
│ │ direction · style · model │ │
│ │ source info  Restore Delete│ │
│ └──────────────────────────┘ │
│ Yesterday                     │
│ ...                           │
└──────────────────────────────┘
```

### 抽屉顶部

显示：

- `History` 标题。
- 简短说明，例如历史保存在本地，API key 不进入历史记录。
- `Close` 按钮。

### 摘要

历史抽屉中包含：

- 本地历史存储估算。
- 翻译记录数量。
- 可用方向摘要。

### 历史记录列表

历史记录按创建时间先后顺序展示，不做分页，通过滚动列表浏览。

实现要求：

- 使用虚拟列表承载历史记录。
- 第一版使用 `@tanstack/react-virtual`。

历史记录可以按日期显示分组标签。

示例分组：

- Today
- Yesterday
- Last week

每条历史记录显示：

- 输出文件名。
- 输入类型或风格标记。
- 翻译方向。
- 翻译风格。
- 模型。
- 源文件名或源内容大小。
- 操作按钮：`Restore`、`Delete`。

## 交互状态

当前原型需要表达以下状态，不要求在本文档中定义最终 UI 样式。

### 翻译方向切换

用户可以在 Header 中切换：

- `English -> 简体中文`
- `中文 -> English`

切换后影响：

- 输出示例语言。
- 下载文件后缀。
- 历史记录中的方向字段。

### 翻译风格切换

用户可以切换翻译风格 preset。

当前仅确认需要有 preset 控件，具体 preset 名称和提示词后续再定。

### 输入类型切换

用户可以切换：

- `Markdown`
- `Plain text`

默认输入类型：

- 粘贴内容默认 `Markdown`。
- `.md` 文件为 `Markdown`。
- `.txt` 文件为 `Plain text`。

### 文件拖拽

拖拽文件到 Source editor 区域时：

- 如果已有文本，提示会覆盖当前内容。
- 如果没有文本，提示文件会作为当前输入。

### 历史抽屉

点击 `History` 打开右侧抽屉。

关闭方式：

- 点击 `Close`。
- 点击抽屉外部遮罩。
- 按 `Esc`。

## 暂不定义

以下内容后续单独设计，本文档不做约束：

- 视觉主题。
- 配色。
- 字体。
- 图标。
- 具体组件库。
- 精确间距。
- 动效。
- 历史记录的最终视觉样式。
- 设置页的最终布局。
- 错误提示的最终文案和分类。
