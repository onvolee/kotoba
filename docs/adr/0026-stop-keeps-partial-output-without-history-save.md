# Stop keeps partial output without saving history

Kotoba will stop active translation requests with `AbortController`. When stopped, the workspace keeps the partial translated output visible and allows users to copy or download it as incomplete output, but the session is marked stopped/incomplete and is not saved to history. Starting a new translation begins a new session and can replace the previous partial output.
