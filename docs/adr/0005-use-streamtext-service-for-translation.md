# Use a streamText service for translation

Kotoba's first translation flow is a single document-to-translation operation, not a chatbot. The workspace will call a dedicated translation service built on AI SDK Core `streamText` and an OpenAI-compatible provider, with Zustand consuming streamed text and session status. We will not install or use `@ai-sdk/react` in the first version unless a later chatbot or AI SDK UI stream workflow is added.
