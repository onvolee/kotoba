# Use a minimal first-version error taxonomy

Kotoba will use a small first-version error taxonomy: missing settings, invalid Base URL, network or CORS failure, provider error, aborted, and unknown error. The UI should show a short understandable message and may expose a sanitized technical summary, but failed, stopped, or incomplete translations are not saved to history. Error handling must not display or persist API keys, Authorization headers, or other credential-bearing details.
