# Store history as text and metadata only

Kotoba history records will store source text, translated text, and translation metadata, but not rendered preview artifacts such as HTML, Mermaid SVG, Shiki tokens, or Streamdown output state. Rendering is derived from the saved translated text when a record is viewed or restored. This keeps IndexedDB records smaller, avoids storing generated executable-looking markup, and prevents renderer-version caches from becoming part of the history data model.
