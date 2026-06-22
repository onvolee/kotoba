# Send AI requests directly from the extension workspace

The first version of Kotoba will not include an application backend or proxy service for translation requests. The extension-owned workspace will use the user's configured Base URL, API Key, and Model to call OpenAI-compatible providers directly, using `ai` and `@ai-sdk/openai-compatible` as the AI integration layer. This keeps the product self-contained as a browser extension, but means provider access, CORS, host permissions, and API key storage are extension-side concerns.
