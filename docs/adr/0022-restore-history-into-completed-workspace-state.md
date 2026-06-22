# Restore history into completed workspace state

Kotoba history restore will load a successful translation record back into the workspace as completed state without automatically re-running translation. Restore brings back the source text, translated text, input type, source filename and extension, translation direction, style preset, Base URL, and Model, but not the API key, rendered preview artifacts, streaming lifecycle, or prior error state. This treats history as recoverable translation output rather than a replayable job queue.
