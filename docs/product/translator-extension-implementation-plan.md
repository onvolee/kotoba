# Translator Extension Implementation Plan

This document summarizes the first-version implementation shape for Kotoba. Product scope lives in [translator-extension-scope.md](./translator-extension-scope.md); layout shape lives in [workspace-prototype.md](../../prototypes/workspace-prototype.md); trade-off records live in [ADR](../adr/).

## Stack

- Package manager: pnpm.
- Extension framework: WXT.
- UI: React and TypeScript.
- State: Zustand for foreground workspace state only.
- UI components: Tailwind CSS, shadcn/ui, and lucide-react.
- UI i18n: react-i18next with English and Simplified Chinese resources.
- Markdown rendering: Streamdown with code and Mermaid plugins.
- History list virtualization: `@tanstack/react-virtual`.
- Tests: Vitest.

## Extension Shape

- The extension icon opens an extension-owned full browser tab workspace.
- The main workflow is not a popup, side panel, or new tab override.
- Settings are a dedicated route inside the workspace app.
- Routing uses internal hash routing rather than React Router or TanStack Router.
- Broad host permission is used for user-configured OpenAI-compatible provider requests.

## AI Integration

- The first version has no application backend or proxy.
- Requests are sent directly from the workspace using the user's Base URL, API Key, and Model.
- AI dependencies are `ai` and `@ai-sdk/openai-compatible`.
- Translation uses AI SDK Core `streamText`.
- Settings connection tests use a tiny AI SDK Core `generateText` request.
- `@ai-sdk/react` is not part of the first-version translation flow.

## Provider Settings

- Required settings: Base URL, API Key, Model.
- Settings are stored in extension local storage, not synced storage.
- API keys are never stored in history records.
- Base URLs are stored as entered, then trimmed, validated, and normalized before requests.
- Base URL must use `http://` or `https://`.
- The first version does not provide provider presets or automatic endpoint rewriting.

## Workspace State

Zustand owns foreground workspace state such as:

- Source text and file metadata.
- Input type.
- Translation direction.
- Translation style preset.
- Translation status and streamed output.
- History drawer state and restored history selection.
- Stale output flags.

Zustand does not own:

- IndexedDB history implementation.
- Extension local storage implementation.
- AI provider construction.
- Routing.
- API key persistence details.

## Translation Session

- Only one active translation session is allowed.
- Streaming uses `AbortController` for stop behavior.
- While streaming, Translate is disabled and Stop is enabled.
- While streaming, translation direction, style preset, and input type are locked.
- Stop keeps partial output visible, marks the session stopped/incomplete, and does not save history.
- Partial stopped output can be copied or downloaded with incomplete status visible.
- Closing or refreshing the workspace interrupts translation and does not save history.
- Completed, failed, stopped, or idle states can start a new translation if input and settings are valid.
- Changing source text, input type, direction, or style after output exists keeps the old output but marks it stale.

## Markdown Handling

- The first version relies on model instructions to preserve Markdown structure.
- Markdown AST parsing and protected text-node replacement are deferred.
- Streamdown is only the rendering layer.
- Streamdown enables code and Mermaid plugins.
- Code blocks use Shiki highlighting with `vitesse-dark` as the dark theme.
- Raw HTML rendering is disabled in the preview layer.
- Copy and download use original translated Markdown/plain text, not rendered preview output.

## Translation Styles

The first version includes three presets:

- `Faithful`: accurate and close to the source structure.
- `Natural`: fluent and idiomatic while preserving meaning.
- `Polished`: publication-ready wording without expanding content.

All presets must preserve Markdown/plain text format and protect code, URLs, file paths, commands, package names, API names, variables, and similar technical tokens.

## Output

- Downloads use UTF-8 text blobs.
- Markdown MIME type: `text/markdown;charset=utf-8`.
- Plain text MIME type: `text/plain;charset=utf-8`.
- File input preserves the source file type.
- Pasted Markdown defaults to `translation.zh.md` or `translation.en.md`.
- Pasted plain text defaults to `translation.zh.txt` or `translation.en.txt`.
- Copy uses the browser Clipboard API.
- Copy uses original Markdown/plain text, never rendered Streamdown HTML.

## History

- History is stored locally in IndexedDB.
- Only successful translations are saved automatically.
- Failed, stopped, aborted, or incomplete translations are not saved.
- History records store text and metadata only.
- History records do not store API keys, rendered HTML, Mermaid SVG, Shiki tokens, or Streamdown state.
- History search is deferred.
- History uses a scrollable virtualized list with `@tanstack/react-virtual`, not pagination.
- History records are displayed in chronological `createdAt` order.
- Single-record delete requires confirmation.
- Undo, batch delete, delete-all, and automatic cleanup are out of scope.
- Restore loads a successful record into completed workspace state without automatically re-running translation.

## Error Handling

The first-version error taxonomy is:

- Missing settings.
- Invalid Base URL.
- Network or CORS failure.
- Provider error.
- Aborted.
- Unknown error.

Errors show a short UI message and may expose sanitized technical detail. API keys, Authorization headers, and credential-bearing details must not appear in UI, logs, or history.

## Testing

Use Vitest for:

- Pure logic such as filenames, input type, prompts, and Base URL normalization.
- Zustand workspace state.
- Storage adapters.
- IndexedDB history repository behavior.
- Translation service streaming, stop, success, and failure behavior with mocked AI SDK streams.

Full browser extension end-to-end tests are deferred until the workspace UI and extension packaging exist.

## First-Version Out Of Scope

- Webpage selection translation.
- Inline webpage translation.
- Browser context menu translation.
- Popup or side-panel main workflow.
- `.doc`, `.docx`, PDF, HTML, image OCR, or rich layout reconstruction.
- Automatic chunking.
- Concurrent translation sessions.
- Translation queues.
- Background continuation.
- Resumable translation.
- Non-streaming fallback.
- Source language auto-detection.
- Arbitrary target languages.
- Full custom prompt editing.
- Markdown AST based translation replacement.
- History search.
- Provider presets.
- Application-level file size warnings or hard limits.

## ADR Index

- [0001 - Use WXT, React, and TypeScript for the extension workspace](../adr/0001-wxt-react-typescript.md)
- [0002 - Send AI requests directly from the extension workspace](../adr/0002-direct-openai-compatible-provider-requests.md)
- [0003 - Store API settings in extension local storage](../adr/0003-store-api-settings-in-extension-local-storage.md)
- [0004 - Use Zustand for workspace state only](../adr/0004-use-zustand-for-workspace-state.md)
- [0005 - Use a streamText service for translation](../adr/0005-use-streamtext-service-for-translation.md)
- [0006 - Use Tailwind CSS, shadcn/ui, and lucide-react for the workspace UI](../adr/0006-use-tailwind-shadcn-lucide-for-ui.md)
- [0007 - Use Vitest for first-version tests](../adr/0007-use-vitest-for-first-version-tests.md)
- [0008 - Use pnpm and the WXT React TypeScript template](../adr/0008-use-pnpm-and-wxt-react-template.md)
- [0009 - Use all_urls host permission for provider requests](../adr/0009-use-all-urls-host-permission-for-provider-requests.md)
- [0010 - Do not support background translation in the first version](../adr/0010-do-not-support-background-translation.md)
- [0011 - Use model instructions and Streamdown for Markdown handling](../adr/0011-use-model-instructions-and-streamdown-for-markdown.md)
- [0012 - Store history as text and metadata only](../adr/0012-store-history-as-text-and-metadata-only.md)
- [0013 - Use a dedicated settings route](../adr/0013-use-a-dedicated-settings-route.md)
- [0014 - Use internal hash routing](../adr/0014-use-internal-hash-routing.md)
- [0015 - Use generateText for connection tests](../adr/0015-use-generatetext-for-connection-tests.md)
- [0016 - Normalize OpenAI-compatible Base URLs at request time](../adr/0016-normalize-openai-compatible-base-url-at-request-time.md)
- [0017 - Use three translation style presets](../adr/0017-use-three-translation-style-presets.md)
- [0018 - Use UTF-8 text blobs for downloads](../adr/0018-use-utf8-text-blobs-for-downloads.md)
- [0019 - Copy original text with the Clipboard API](../adr/0019-copy-original-text-with-clipboard-api.md)
- [0020 - Do not set application file size limits in the first version](../adr/0020-do-not-set-application-file-size-limits.md)
- [0021 - Use a minimal first-version error taxonomy](../adr/0021-use-minimal-error-taxonomy.md)
- [0022 - Restore history into completed workspace state](../adr/0022-restore-history-into-completed-workspace-state.md)
- [0023 - Defer history search](../adr/0023-defer-history-search.md)
- [0024 - Use a virtualized history list without pagination](../adr/0024-use-virtualized-history-list-without-pagination.md)
- [0025 - Confirm single history deletes without undo](../adr/0025-confirm-single-history-delete-without-undo.md)
- [0026 - Stop keeps partial output without saving history](../adr/0026-stop-keeps-partial-output-without-history-save.md)
- [0027 - Allow one active translation session](../adr/0027-allow-one-active-translation-session.md)
- [0028 - Mark output stale after input or option changes](../adr/0028-mark-output-stale-after-input-or-option-changes.md)
- [0029 - Use react-i18next for UI internationalization](../adr/0029-use-react-i18next-for-ui-internationalization.md)
