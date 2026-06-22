# Store API settings in extension local storage

Kotoba will store the user's Base URL, API Key, and Model in extension local storage so the user does not need to reconfigure the provider after every browser restart. Translation history remains in IndexedDB because it can grow much larger than settings, and API keys must never be copied into history records. We will not use synced storage for API keys by default because cross-device synchronization increases the privacy and security surface for a user-owned provider credential.
