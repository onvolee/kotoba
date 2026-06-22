# Use generateText for connection tests

Kotoba's settings route will provide a connection test that sends a tiny AI SDK Core `generateText` request with the current Base URL, API Key, and Model. The test verifies that the provider configuration can complete a basic request and return text, without requiring streaming behavior or exact response content. More detailed provider error taxonomy can be designed later after the first settings UI exists.
