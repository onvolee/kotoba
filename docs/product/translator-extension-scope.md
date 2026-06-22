# Browser Translation Extension Scope

## Purpose

Build a browser extension for translating short-to-medium Markdown and plain text content between English and Chinese.

The first version is a focused translation workspace, not a general document conversion tool or webpage translation tool.

## Confirmed First Version Scope

### Interface Shape

- The main product surface is a full browser tab workspace.
- The extension icon should open the workspace page.
- The workspace is an extension-owned page, not a popup, new tab override, or side panel.
- Detailed page layout, visual design, and interaction details are intentionally deferred.

### Supported Input Methods

- Users can drag and drop supported files into the workspace.
- Users can upload supported files.
- Users can paste text into an input box.

### Supported File Types

The first version only supports plain text based files:

- `.md`
- `.txt`

Other file types are out of scope for the first version.

`.doc`, `.docx`, PDF, HTML, image OCR, and rich document layout preservation are deferred.

### Input Type

- Uploaded `.md` files are treated as Markdown.
- Uploaded `.txt` files are treated as plain text.
- Pasted input defaults to Markdown.
- Users can switch pasted input between Markdown and plain text.

### Format Preservation

The translation should preserve the original content format.

For Markdown:

- Preserve Markdown syntax.
- Preserve heading structure.
- Preserve lists.
- Preserve tables.
- Preserve blockquotes.
- Preserve code blocks and inline code.
- Preserve links and URLs.
- Preserve file paths, commands, package names, API names, variables, and similar technical tokens.
- Translate natural language content only.

For plain text:

- Preserve paragraph breaks and line structure as much as possible.
- Translate natural language content only.

The first version relies on model instructions to preserve Markdown structure. Markdown AST level parsing and protected text-node replacement are deferred.

Markdown translation output is rendered in the workspace with Streamdown. Streamdown is used as the streaming Markdown rendering layer, not as a translation-protection or AST replacement layer.

Streamdown requirements:

- Enable the code plugin for code block rendering.
- Use Shiki highlighting for code blocks.
- Use `vitesse-dark` as the dark code highlighting theme.
- Enable the Mermaid plugin for Mermaid diagram rendering.
- Disable raw HTML rendering in the Streamdown preview layer for AI-generated output.
- Copy and download actions use the original translated Markdown text, not the filtered preview output.

### Translation Direction

- Default direction is English to Simplified Chinese.
- Users can switch direction to Chinese to English with a direction toggle.
- Only these two directions are in scope for the first version.
- Automatic source language detection is out of scope.
- General multi-language translation is out of scope.

### Translation Style

- Users can choose from three translation style presets:
  - `Faithful`: accurate and close to the source structure.
  - `Natural`: fluent and idiomatic while preserving meaning.
  - `Polished`: publication-ready wording without expanding the content.
- All presets must still preserve Markdown or plain text format.
- All presets must preserve code, URLs, file paths, commands, package names, API names, variables, and similar technical tokens.
- Full custom prompt editing is out of scope for the first version.

### Model Provider

The extension uses user-provided OpenAI-compatible API settings.

Required settings:

- Base URL
- API Key
- Model

Base URL behavior:

- Store the user's entered Base URL.
- Validate and normalize the Base URL before making requests.
- Require `http://` or `https://`.
- Trim whitespace and remove trailing slashes for request construction.
- Do not provide provider presets in the first version.
- Do not automatically guess or rewrite provider-specific endpoints.

Model and API settings are managed in a dedicated settings route inside the extension-owned workspace application, not in a drawer, dialog, popup, or separate browser options page.

The settings route provides a connection test using a tiny AI SDK Core `generateText` request with the current API settings.

The first version uses Chat Completions compatible requests because this covers providers such as OpenAI-compatible DeepSeek deployments.

The first version does not include an application backend or proxy service. AI requests are sent directly from the extension-owned workspace using the user's configured API settings.

AI integration dependencies:

- `ai`
- `@ai-sdk/openai-compatible`

The extension should not ship with a hardcoded shared API key.

### Streaming

- Translation output is streamed by default.
- The first version uses an AI SDK Core `streamText` based translation service rather than AI SDK React chat hooks.
- The first version does not need a non-streaming fallback.
- The user should see output progressively as it is generated.
- Streaming only continues while the workspace page is alive.
- Closing or refreshing the workspace interrupts the current translation, and interrupted translations are not saved to history.
- `Stop` aborts the active translation request.
- Stopped translations keep partial output visible, but are marked stopped or incomplete and are not saved to history.
- The workspace allows only one active translation session at a time.
- While streaming, `Translate` is disabled and `Stop` is enabled.
- While streaming, translation direction, style preset, and input type are locked.
- After idle, completed, failed, or stopped states, `Translate` can start a new session if input and settings are valid.

### Request Shape

- The first version translates the whole input in one request.
- The first version does not set application-level file size warnings or hard limits.
- Automatic chunking is out of scope.
- Per-block retry, concurrent translation sessions, translation queues, resumable translation, and background continuation are out of scope.

This boundary is based on the expected usage: individual `.md` or `.txt` files, not long novels or very large corpora. Practical size limits come from the configured provider, model context window, network behavior, and user cost tolerance.

### Output

- Users can view the translated result in the workspace.
- If source text, input type, translation direction, or style preset changes after output exists, the old output remains visible but is marked stale.
- Users can copy the translated text.
- Copy actions use the browser Clipboard API.
- Copying translation output copies the original translated Markdown or plain text, not rendered preview HTML.
- During streaming, users can copy the currently generated partial translation.
- Clipboard failures show an error; legacy copy fallbacks are out of scope.
- Users can download translated file output.
- Users can download partial stopped output, but the UI should indicate that it is incomplete.
- Users can copy or download stale output, but the UI should indicate that it may not match the current input or options.
- For file input, the downloaded file should preserve the source file type.
- Downloads use UTF-8 text blobs.
- Markdown downloads use `text/markdown;charset=utf-8`.
- Plain text downloads use `text/plain;charset=utf-8`.
- Suggested filename suffixes:
  - English to Chinese: `.zh`
  - Chinese to English: `.en`

Examples:

- `README.md` to `README.zh.md`
- `notes.txt` to `notes.zh.txt`
- `README.md` to `README.en.md`
- `notes.txt` to `notes.en.txt`
- Pasted Markdown input downloads as `translation.zh.md` or `translation.en.md`.
- Pasted plain text input downloads as `translation.zh.txt` or `translation.en.txt`.

### History

The product should save translation history.

Confirmed behavior:

- History is saved locally.
- History uses IndexedDB, not `chrome.storage.local`, because history can exceed extension setting storage quotas.
- History search is out of scope for the first version.
- History records are displayed in chronological `createdAt` order.
- History browsing uses a scrollable virtualized list with `@tanstack/react-virtual`, not pagination.
- Settings and API configuration are saved in extension local storage so users do not need to reconfigure the provider after each browser restart.
- API configuration is local to the user's browser profile and should not use synced storage by default.
- There is no user-facing "save history" toggle in the first version.
- Successful translations are saved automatically.
- Failed translations are not saved.
- Stopped or incomplete streaming translations are not saved.
- API keys must never be stored in history records.
- History records do not store rendered preview artifacts such as HTML, Mermaid SVG, Shiki tokens, or Streamdown output state.
- The settings area should show an estimated storage usage value for translation history.

History deletion behavior:

- Users decide whether to keep or delete history.
- Automatic cleanup is not required.
- Deleting a single history record requires confirmation.
- Confirmed deletes remove the record from IndexedDB.
- If the deleted record is currently restored in the workspace, the workspace content remains unchanged.
- Undo, batch delete, and delete-all actions are out of scope for the first version.
- Exact history management UI is deferred.

History restore behavior:

- Restore loads a successful translation record into the workspace without automatically re-running translation.
- Restore sets the translation state to completed.
- Restore includes source text, translated text, input type, source filename and extension, translation direction, translation style preset, Base URL, and Model.
- Restore does not include API Key, rendered preview artifacts, streaming lifecycle, or prior error state.
- Users can copy or download the restored translation, edit the source, or start a new translation.
- If the restored Base URL or Model differs from current settings, the UI can show a non-blocking hint.

Suggested history fields:

- Source text
- Translated text
- Input type
- Source filename, if any
- File extension, if any
- Translation direction
- Translation style preset
- Created time
- Base URL
- Model

### Error Handling

The first version uses a minimal error taxonomy:

- Missing settings
- Invalid Base URL
- Network or CORS failure
- Provider error
- Aborted
- Unknown error

Error handling requirements:

- Show a short understandable message in the UI.
- Technical details can be shown as a sanitized summary.
- Failed, stopped, aborted, or incomplete translations are not saved to history.
- API keys, Authorization headers, and credential-bearing details must not appear in error UI, logs, or history records.

### UI Internationalization

- The first version supports English and Simplified Chinese UI.
- The default UI language follows the browser language.
- Unsupported browser languages fall back to English.
- Users can override the UI language in settings.
- The selected UI language is saved in extension local storage.
- UI copy uses `react-i18next` resources.
- Model-generated translation content is user data and is not managed by UI internationalization.

## Explicitly Out Of Scope For First Version

- Webpage selection translation.
- Inline webpage translation.
- Browser right-click menu translation.
- Popup-based main workflow.
- Side panel based main workflow.
- New tab override.
- Word document parsing or `.doc/.docx` output.
- PDF translation.
- HTML translation.
- Image OCR.
- Rich document layout reconstruction.
- Automatic chunking.
- Non-streaming fallback.
- Automatic source language detection.
- Arbitrary target language selection.
- Full custom prompt editing.
- Markdown AST based translation replacement.
- Detailed layout, component design, and visual style.
- Detailed error-handling UX.

## Technology Direction

- Use pnpm as the only package manager.
- Use WXT.js for the browser extension.
- Start from WXT's React TypeScript template.
- Use React and TypeScript for the extension-owned workspace UI.
- Use `react-i18next` for UI internationalization.
- Use Zustand for foreground workspace UI and session state.
- Use Tailwind CSS, shadcn/ui, and lucide-react for workspace components and icons.
- Use a dedicated settings route for model and API configuration.
- Use internal hash routing for workspace pages instead of a full routing library.
- Use Streamdown with code and Mermaid plugins to render streamed Markdown translation output.
- Use `@tanstack/react-virtual` for the history drawer list.
- Use Vitest for first-version tests covering pure logic, storage adapters, history repository behavior, translation service behavior, and Zustand workspace state.
- Full browser extension end-to-end tests are deferred until the workspace UI and extension packaging are implemented.
- Use broad host permission for provider requests so user-configured OpenAI-compatible Base URLs can work.
- Browser compatibility should be handled through WXT where practical.
- The first version should be designed around an extension-owned full tab workspace.

## Open Questions For Later Discussion

- Exact workspace layout and navigation.
- Exact settings UI.
- Exact history browsing and deletion UI.
- Whether to add history search after the first version.
- Whether to add Markdown AST protection after the first version.
