# Kotoba

Kotoba is a browser extension for translating short-to-medium Markdown and plain text content between English and Simplified Chinese.

## Language

**Workspace**:
The extension-owned full browser tab where users input source content, configure translation options, run translation, view output, and access local history.
_Avoid_: Popup, side panel, new tab override

**Source Content**:
The Markdown or plain text content provided by paste, upload, or drag-and-drop before translation.
_Avoid_: Document, webpage, corpus

**Content Display Mode**:
The user's choice to show source content or translation output as raw plain text or rendered Markdown in a single panel content area.
_Avoid_: Content format, file type, editor mode

**Translation Output**:
The translated Markdown or plain text generated from source content.
_Avoid_: Rendered preview, HTML output

**Translation Direction**:
The selected source-to-target language pair. The first version supports English to Simplified Chinese and Chinese to English.
_Avoid_: Language detection, multilingual target

**Translation Style Preset**:
A selectable style that tunes translation tone while preserving the shared formatting and technical-token constraints.
_Avoid_: Custom prompt, prompt template

**Translation History**:
Local records of successful translations that can be restored into the workspace.
_Avoid_: Job queue, backup, rendered cache

**Settings**:
The workspace route where users configure model provider access and UI preferences.
_Avoid_: Options page, settings dialog, settings drawer
