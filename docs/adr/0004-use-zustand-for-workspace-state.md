# Use Zustand for workspace state only

Kotoba will use Zustand for foreground workspace state such as source input, file metadata, translation direction, style preset, input type, streaming output, current translation status, transient workspace UI state, and restored history selection. Zustand should not own the IndexedDB history implementation, extension local storage implementation, AI SDK provider construction, routing, or API key persistence details. Keeping these as separate services prevents the workspace store from becoming the hidden integration layer for the whole extension.
