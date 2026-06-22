# Copy original text with the Clipboard API

Kotoba copy actions will use the browser Clipboard API to copy source text or translated text as plain Markdown/plain text. Translation copy actions copy the current generated text, including partial streamed output, and never copy rendered Streamdown HTML. If Clipboard API copying fails, the first version shows an error instead of maintaining an older `execCommand` fallback path.
