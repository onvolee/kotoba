# Normalize OpenAI-compatible Base URLs at request time

Kotoba will store the user's Base URL as entered, but validate and normalize it before creating an OpenAI-compatible provider. The first version only accepts `http://` and `https://` URLs, trims whitespace, removes trailing slashes for request construction, and does not guess provider-specific endpoints or offer provider presets. This avoids surprising rewrites while still catching common configuration mistakes before translation or connection tests run.
